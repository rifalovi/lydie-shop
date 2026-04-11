import { createAdminClient } from "@/lib/supabase/admin";

export type UsageAction =
  | "chat"
  | "incubation_suggest"
  | "indicator_generate"
  | "indicator_smart_test"
  | "era_analyze"
  | "era_themes"
  | "questionnaire_generate"
  | "questionnaire_improve"
  | "analyse_documentaire";

interface AnthropicUsage {
  input_tokens?: number;
  output_tokens?: number;
}

interface UsageParams {
  userId: string | null | undefined;
  action: UsageAction;
  usage: AnthropicUsage | null | undefined;
  model?: string;
}

const DEFAULT_MODEL = "claude-sonnet-4-6";

/**
 * Records token usage for a given user after a successful Anthropic call.
 *
 * Accepts two calling styles:
 *   1. trackUsage({ userId, action, usage, model })  // recommended
 *   2. trackUsage(supabaseClient, userId, action, usage, model)
 *
 * The helper always uses the admin client internally so the increment is
 * not blocked by RLS. The first positional argument is kept for API
 * ergonomics but its value is ignored.
 *
 * Errors are intentionally swallowed so a logging/RLS issue can never
 * break the primary API response.
 */
export async function trackUsage(params: UsageParams): Promise<void>;
export async function trackUsage(
  supabaseOrIgnored: unknown,
  userId: string | null | undefined,
  action: UsageAction,
  usage: AnthropicUsage | null | undefined,
  model?: string
): Promise<void>;
export async function trackUsage(
  first: UsageParams | unknown,
  userId?: string | null,
  action?: UsageAction,
  usage?: AnthropicUsage | null | undefined,
  model?: string
): Promise<void> {
  let resolved: UsageParams;
  if (
    first &&
    typeof first === "object" &&
    "action" in (first as UsageParams) &&
    "userId" in (first as UsageParams)
  ) {
    resolved = first as UsageParams;
  } else {
    resolved = {
      userId: userId ?? null,
      action: action as UsageAction,
      usage,
      model,
    };
  }

  try {
    const { userId: uid, action: act, usage: usg } = resolved;
    if (!uid || !usg) return;

    const inputTokens = usg.input_tokens ?? 0;
    const outputTokens = usg.output_tokens ?? 0;
    const tokensUsed = inputTokens + outputTokens;
    if (tokensUsed <= 0) return;

    const modelName = resolved.model ?? DEFAULT_MODEL;
    const month = new Date().toISOString().slice(0, 7);
    const supabase = createAdminClient();

    await supabase.rpc("increment_tokens", {
      p_user_id: uid,
      p_tokens: tokensUsed,
      p_month: month,
    });

    await supabase.from("usage_logs").insert({
      user_id: uid,
      action: act,
      tokens_input: inputTokens,
      tokens_output: outputTokens,
      tokens_total: tokensUsed,
      model: modelName,
    });
  } catch (err) {
    console.warn("trackUsage error:", err);
  }
}
