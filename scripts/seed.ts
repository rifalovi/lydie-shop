/**
 * Seed script for CLAC P05 pilot project
 * Run: npx tsx scripts/seed.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seed() {
  console.log("Seeding CLAC P05 pilot data...");

  // We need a user to own the project - use first available or skip
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.[0];

  if (!user) {
    console.log("No users found. Create a user first, then run seed again.");
    return;
  }

  // Ensure profile exists
  await supabase.from("profiles").upsert({
    id: user.id,
    full_name: user.user_metadata?.full_name || "Utilisateur test",
    role: "coordonnateur",
  });

  // Create project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      code: "P05",
      title: "Acquérir des savoirs, découvrir le monde (CLAC)",
      programme_strategique: "PS1",
      countries: [
        "Bénin", "Côte d'Ivoire", "Guinée", "Liban", "Madagascar",
        "Togo", "Tchad", "Centrafrique", "Comores", "Haïti", "Arménie",
      ],
      budget_total: 3900000,
      budget_se: 100000,
      global_objective:
        "Renforcer l'accès des populations périurbaines et rurales (notamment les jeunes et les femmes) aux savoirs, à la culture, à l'information, pour améliorer les apprentissages et l'éducation, l'inclusion sociale et le développement local.",
      status: "active",
      current_step: 4,
    })
    .select()
    .single();

  if (projectError || !project) {
    console.error("Error creating project:", projectError);
    return;
  }
  console.log(`Project created: ${project.id}`);

  // Stakeholders
  const stakeholders = [
    { type: "beneficiaire_direct", description: "Populations périurbaines et rurales, jeunes et filles" },
    { type: "beneficiaire_indirect", description: "Acteurs culturels, monde éducatif, collectivités" },
    { type: "partenaire", description: "Structures nationales de lecture publique" },
    { type: "intermediaire", description: "Animateurs des réseaux CLAC" },
  ];

  await supabase.from("stakeholders").insert(
    stakeholders.map((s) => ({ ...s, project_id: project.id }))
  );
  console.log("Stakeholders created");

  // Results chain
  const chain = [
    // Intrants
    { level: "intrant", title: "Budget 3,9M€", order_index: 0 },
    { level: "intrant", title: "Équipe experte animation culturelle", order_index: 1 },
    // Activités
    { level: "activite", title: "Formation des cadres nationaux et locaux en charge des CLAC", order_index: 0 },
    { level: "activite", title: "Appui à l'organisation d'activités culturelles", order_index: 1 },
    { level: "activite", title: "Solarisation des CLAC", order_index: 2 },
    { level: "activite", title: "Évaluation des CLAC et des sites", order_index: 3 },
    { level: "activite", title: "Plaidoyer pour les espaces du livre francophone", order_index: 4 },
    // Extrants
    { level: "extrant", title: "119 CLAC soutenus pour l'organisation d'activités culturelles", order_index: 0 },
    { level: "extrant", title: "71 animateurs et agents formés", order_index: 1 },
    { level: "extrant", title: "38 CLAC avec fonds documentaires renouvelés", order_index: 2 },
    { level: "extrant", title: "6 CLAC équipés en systèmes solaires", order_index: 3 },
    { level: "extrant", title: "5 CLAC avec formations D-CLIC (275 jeunes formés)", order_index: 4 },
    // Effets immédiats
    { level: "effet_immediat", title: "Les animateurs ont renforcé leurs compétences en gestion et animation", order_index: 0 },
    { level: "effet_immediat", title: "Les agents ont amélioré leurs capacités de sélection bibliographique", order_index: 1 },
    { level: "effet_immediat", title: "Les usagers ont accès à des contenus culturels et numériques", order_index: 2 },
    // Effets intermédiaires
    { level: "effet_intermediaire", title: "L'accès à la lecture publique augmente dans les pays couverts", order_index: 0 },
    { level: "effet_intermediaire", title: "Les compétences linguistiques des élèves s'améliorent", order_index: 1 },
    { level: "effet_intermediaire", title: "Les jeunes et femmes ont de nouvelles opportunités professionnelles", order_index: 2 },
    // Impacts
    { level: "impact", title: "La qualité de l'éducation est renforcée dans le respect de la diversité linguistique", order_index: 0 },
    { level: "impact", title: "La lecture publique est intégrée aux politiques culturelles nationales", order_index: 1 },
  ];

  await supabase.from("results_chain").insert(
    chain.map((c) => ({ ...c, project_id: project.id }))
  );
  console.log("Results chain created");

  // Get result chain IDs for indicator linking
  const { data: chainData } = await supabase
    .from("results_chain")
    .select("id, level, title")
    .eq("project_id", project.id);

  const findResult = (level: string, index: number) =>
    chainData?.filter((c) => c.level === level)?.[index]?.id;

  // Indicators
  const indicators = [
    {
      code: "IND-PS1-EDU-001",
      title: "Nombre d'animateurs formés en gestion et animation des CLAC",
      definition: "Nombre total d'animateurs et agents ayant participé aux formations de renforcement de capacités",
      formula: "Comptage direct des participants",
      unit: "#",
      type: "quantitatif",
      frequency: "annuelle",
      result_id: findResult("extrant", 1),
      target_2024: 30,
      target_2025: 50,
      target_2026: 71,
      target_2027: 80,
      disaggregations: ["sexe", "pays"],
    },
    {
      code: "IND-PS1-EDU-002",
      title: "% d'usagers déclarant une amélioration de leurs compétences linguistiques",
      definition: "Proportion des usagers des CLAC qui déclarent avoir amélioré leurs compétences en lecture et écriture",
      formula: "Nombre d'usagers déclarant une amélioration / Nombre total d'usagers enquêtés × 100",
      unit: "%",
      type: "quantitatif",
      frequency: "annuelle",
      result_id: findResult("effet_immediat", 0),
      target_2024: 50,
      target_2025: 65,
      target_2026: 75,
      target_2027: 80,
      disaggregations: ["sexe", "age", "pays"],
      cad_criterion: "efficacite",
    },
    {
      code: "IND-PS1-EDU-003",
      title: "% de femmes déclarant de nouvelles opportunités professionnelles grâce au CLAC",
      definition: "Proportion de femmes bénéficiaires qui identifient de nouvelles opportunités professionnelles liées à leur fréquentation du CLAC",
      formula: "Nombre de femmes déclarant des opportunités / Nombre total de femmes enquêtées × 100",
      unit: "%",
      type: "quantitatif",
      frequency: "annuelle",
      result_id: findResult("effet_intermediaire", 2),
      target_2024: 20,
      target_2025: 30,
      target_2026: 40,
      target_2027: 50,
      disaggregations: ["pays"],
      cad_criterion: "impact",
    },
  ];

  await supabase.from("indicators").insert(
    indicators.map((ind) => ({ ...ind, project_id: project.id }))
  );
  console.log("Indicators created");

  console.log("\nSeed completed successfully!");
  console.log(`Project ID: ${project.id}`);
}

seed().catch(console.error);
