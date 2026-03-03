export type Question = {
  id: string
  text: string
  choices: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
}

export const QUESTIONS: Question[] = [
  { id: "q1", text: "مين أخرج فيلم The Dark Knight؟", choices: ["نولان", "سبيلبرج", "سكورسيزي", "فينشر"], correctIndex: 0 },
  { id: "q2", text: "فيلم Inception نزل سنة كام؟", choices: ["2008", "2010", "2012", "2014"], correctIndex: 1 },
  { id: "q3", text: "مين بطل فيلم Forrest Gump؟", choices: ["براد بيت", "توم هانكس", "مات ديمون", "كيانو ريفز"], correctIndex: 1 },
  { id: "q4", text: "Harry Potter مبني على كتب مين؟", choices: ["تولكين", "جورج مارتن", "J.K. Rowling", "دان براون"], correctIndex: 2 },
  { id: "q5", text: "مين بطل Gladiator؟", choices: ["راسل كرو", "خواكين فينيكس", "كريستيان بيل", "هيو جاكمان"], correctIndex: 0 },
  { id: "q6", text: "فيلم Titanic بطولة؟", choices: ["دي كابريو", "توم كروز", "براد بيت", "ويل سميث"], correctIndex: 0 },
  { id: "q7", text: "مين أخرج Pulp Fiction؟", choices: ["تارانتينو", "نولان", "سكورسيزي", "كوبرِك"], correctIndex: 0 },
  { id: "q8", text: "Avengers: Endgame نزل سنة؟", choices: ["2017", "2018", "2019", "2020"], correctIndex: 2 },
  { id: "q9", text: "فيلم Parasite من دولة؟", choices: ["اليابان", "كوريا", "الصين", "تايلاند"], correctIndex: 1 },
  { id: "q10", text: "مين بطل John Wick؟", choices: ["كيانو ريفز", "جيسون ستاثام", "ليام نيسون", "مارك وولبرج"], correctIndex: 0 },
]