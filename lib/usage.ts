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

const DEFAULT_MODEL = "claude-sonnet-4-6";

/**
 * Records token usage for a given user after a successful Anthropic call.
 * Uses the service-role client so the increment is not blocked by RLS and so
 * anonymous / unauthenticated calls are simply skipped (userId can be null).
 *
 * Intentionally swallows all errors so a logging/RLS issue can never break
 * the primary API response.
 */
export async function trackUsage(params: {
  userId: string | null | undefined;
  action: UsageAction;
  usage: AnthropicUsage | null | undefined;
  model?: string;
}) {
  try {
    const { userId, action, usage } = params;
    if (!userId || !usage) return;

    const inputTokens = usage.input_tokens ?? 0;
    const outputTokens = usage.output_tokens ?? 0;
    const tokensUsed = inputTokens + outputTokens;
    if (tokensUsed <= 0) return;

    const model = params.model ?? DEFAULT_MODEL;
    const month = new Date().toISOString().slice(0, 7);
    const supabase = createAdminClient();

    await supabase.rpc("increment_tokens", {
      p_user_id: userId,
      p_tokens: tokensUsed,
      p_month: month,
    });

    await supabase.from("usage_logs").insert({
      user_id: userId,
      action,
      tokens_input: inputTokens,
      tokens_output: outputTokens,
      tokens_total: tokensUsed,
      model,
    });
  } catch (err) {
    console.warn("trackUsage error:", err);
  }
}
