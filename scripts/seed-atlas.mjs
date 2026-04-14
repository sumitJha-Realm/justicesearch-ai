import { MongoClient } from "mongodb";
import { readFileSync } from "fs";

import { config } from "dotenv";
config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("Set MONGODB_URI in .env.local"); process.exit(1); }
const DB_NAME = "justicesearch";
const BATCH_SIZE = 500;

// Load generated 1000 judgments
const generated = JSON.parse(readFileSync("scripts/generated-judgments.json", "utf8"));

// Load original 12 judgments (parse from TS file manually)
const original = [
  { _id:"j001", caseNumber:"SLP(Crl.) 3214/2023", caseTitle:"State of Maharashtra v. Rajesh Kumar Sharma", court:"Supreme Court of India", courtLevel:"Supreme Court", bench:["Justice D.Y. Chandrachud","Justice J.B. Pardiwala"], dateOfJudgment:"2024-01-15", year:2024, disposition:"Dismissed", category:"Criminal - Homicide", acts:["Indian Penal Code, 1860","Code of Criminal Procedure, 1973"], sections:["Section 302 IPC","Section 304 IPC","Section 313 CrPC"], headnotes:"Murder - Circumstantial evidence - Chain of circumstances must be complete - Last seen theory - Recovery of weapon at the instance of accused - Conviction upheld.", fullText:"The prosecution has established beyond reasonable doubt that the accused was last seen with the deceased. The recovery of the murder weapon at the instance of the accused under Section 27 of the Evidence Act strengthens the chain of circumstantial evidence. The High Court rightly upheld the conviction under Section 302 of IPC. The circumstantial evidence forms a complete chain pointing unmistakably towards the guilt of the accused, leaving no room for any hypothesis consistent with innocence.", snippet:"The chain of circumstantial evidence must be complete and should not leave any reasonable ground for a conclusion consistent with the innocence of the accused.", citedBy:["j003","j008"], citesTo:["Sharad Birdhichand Sarda v. State of Maharashtra (1984)"], district:"Mumbai", state:"Maharashtra", petitioner:"State of Maharashtra", respondent:"Rajesh Kumar Sharma", tags:["circumstantial evidence","murder","last seen theory","Section 302"] },
  { _id:"j002", caseNumber:"WP(C) 8876/2023", caseTitle:"Ananya Sharma v. Union of India", court:"Supreme Court of India", courtLevel:"Supreme Court", bench:["Justice S.A. Nazeer","Justice V. Ramasubramanian"], dateOfJudgment:"2024-03-22", year:2024, disposition:"Allowed", category:"Constitutional - Fundamental Rights", acts:["Constitution of India","Right to Information Act, 2005"], sections:["Article 14","Article 19(1)(a)","Article 21"], headnotes:"Right to Privacy - Digital surveillance - Proportionality test - State obligation to protect personal data.", fullText:"The right to privacy, as recognized in K.S. Puttaswamy v. Union of India, is a fundamental right under Article 21.", snippet:"Mass digital surveillance without adequate safeguards violates the fundamental right to privacy under Article 21.", citedBy:["j005"], citesTo:["K.S. Puttaswamy v. Union of India (2017)"], district:"New Delhi", state:"Delhi", petitioner:"Ananya Sharma", respondent:"Union of India", tags:["privacy","digital surveillance","fundamental rights","Article 21"] },
  { _id:"j003", caseNumber:"CrlA 445/2022", caseTitle:"Vikram Singh v. State of Uttar Pradesh", court:"Allahabad High Court", courtLevel:"High Court", bench:["Justice Arun Tandon","Justice Samit Gopal"], dateOfJudgment:"2023-11-08", year:2023, disposition:"Partly Allowed", category:"Criminal - Homicide", acts:["Indian Penal Code, 1860","Indian Evidence Act, 1872"], sections:["Section 302 IPC","Section 304 Part II IPC","Section 27 Evidence Act"], headnotes:"Culpable homicide not amounting to murder - Sudden provocation - Alteration of conviction from Section 302 to 304 Part II.", fullText:"The evidence on record reveals that there was a sudden quarrel between the accused and the deceased over a property dispute.", snippet:"When death is caused in a sudden quarrel without premeditation, the offence is culpable homicide not amounting to murder.", citedBy:[], citesTo:["j001"], district:"Lucknow", state:"Uttar Pradesh", petitioner:"Vikram Singh", respondent:"State of Uttar Pradesh", tags:["culpable homicide","sudden provocation","Section 304"] },
  { _id:"j004", caseNumber:"FA 2210/2021", caseTitle:"Priya Mehta v. Suresh Mehta", court:"Bombay High Court", courtLevel:"High Court", bench:["Justice G.S. Patel"], dateOfJudgment:"2023-07-14", year:2023, disposition:"Allowed", category:"Family - Matrimonial Disputes", acts:["Hindu Marriage Act, 1955","Protection of Women from Domestic Violence Act, 2005"], sections:["Section 13(1)(ia) HMA","Section 125 CrPC","Section 12 PWDVA"], headnotes:"Divorce - Mental cruelty - Persistent dowry demands - Maintenance awarded.", fullText:"The wife has established persistent cruelty by the husband and his family members through continuous dowry demands.", snippet:"Persistent dowry demands coupled with physical and mental cruelty constitute grounds for divorce.", citedBy:["j009"], citesTo:["Samar Ghosh v. Jaya Ghosh (2007)"], district:"Mumbai", state:"Maharashtra", petitioner:"Priya Mehta", respondent:"Suresh Mehta", tags:["divorce","cruelty","dowry","maintenance","matrimonial"] },
  { _id:"j005", caseNumber:"WP(C) 1156/2024", caseTitle:"Digital Rights Foundation v. State of Karnataka", court:"Karnataka High Court", courtLevel:"High Court", bench:["Justice Krishna S. Dixit","Justice C.M. Joshi"], dateOfJudgment:"2024-05-10", year:2024, disposition:"Allowed", category:"Constitutional - Fundamental Rights", acts:["Constitution of India","Information Technology Act, 2000"], sections:["Article 19(1)(a)","Article 21","Section 69A IT Act"], headnotes:"Internet shutdown - Proportionality - Right to access internet as part of right to education and livelihood.", fullText:"Access to the internet is a fundamental right forming part of the right to education under Article 21A.", snippet:"Access to internet is a fundamental right under Articles 19 and 21.", citedBy:[], citesTo:["j002"], district:"Bengaluru", state:"Karnataka", petitioner:"Digital Rights Foundation", respondent:"State of Karnataka", tags:["internet shutdown","digital rights","proportionality","Article 19"] },
  { _id:"j006", caseNumber:"CS(Comm) 334/2022", caseTitle:"TechCorp India Pvt Ltd v. InnovateSoft Solutions", court:"Delhi High Court", courtLevel:"High Court", bench:["Justice Prathiba M. Singh"], dateOfJudgment:"2023-09-28", year:2023, disposition:"Partly Allowed", category:"Commercial - Intellectual Property", acts:["Copyright Act, 1957","Information Technology Act, 2000","Indian Contract Act, 1872"], sections:["Section 14 Copyright Act","Section 51 Copyright Act","Section 73 Contract Act"], headnotes:"Software copyright infringement - Source code comparison - Clean room defense rejected.", fullText:"The plaintiff has demonstrated substantial similarity between its proprietary software code and the defendant's product.", snippet:"Software source code is entitled to copyright protection.", citedBy:[], citesTo:["Eastern Book Co v. D.B. Modak (2008)"], district:"New Delhi", state:"Delhi", petitioner:"TechCorp India Pvt Ltd", respondent:"InnovateSoft Solutions", tags:["copyright","software","intellectual property","injunction"] },
  { _id:"j007", caseNumber:"WP(C) 5567/2023", caseTitle:"Green Earth Foundation v. Ministry of Environment", court:"National Green Tribunal", courtLevel:"High Court", bench:["Justice Adarsh Kumar Goel"], dateOfJudgment:"2024-02-05", year:2024, disposition:"Allowed", category:"Environmental Law", acts:["Environment Protection Act, 1986","Water (Prevention and Control of Pollution) Act, 1974"], sections:["Section 3 EPA","Section 17 EPA","Section 24 Water Act"], headnotes:"Industrial pollution - River contamination - Polluter pays principle.", fullText:"The industrial unit has been discharging untreated effluents into the river.", snippet:"Under the polluter pays principle, an industrial unit discharging untreated effluents must compensate affected communities.", citedBy:[], citesTo:["M.C. Mehta v. Union of India (1987)"], district:"Varanasi", state:"Uttar Pradesh", petitioner:"Green Earth Foundation", respondent:"Ministry of Environment", tags:["pollution","environment","polluter pays","river contamination"] },
  { _id:"j008", caseNumber:"BA 1123/2024", caseTitle:"Mohd. Farooq v. State of Rajasthan", court:"Rajasthan High Court", courtLevel:"High Court", bench:["Justice Pankaj Bhandari"], dateOfJudgment:"2024-04-18", year:2024, disposition:"Allowed", category:"Criminal - Bail", acts:["Code of Criminal Procedure, 1973","Narcotic Drugs and Psychotropic Substances Act, 1985"], sections:["Section 37 NDPS Act","Section 439 CrPC","Section 21 NDPS Act"], headnotes:"Bail in NDPS case - Small quantity recovery - Prolonged incarceration - Right to speedy trial.", fullText:"The applicant has been in custody for over 2 years.", snippet:"Prolonged incarceration without trial progress warrants bail.", citedBy:[], citesTo:["j001"], district:"Jaipur", state:"Rajasthan", petitioner:"Mohd. Farooq", respondent:"State of Rajasthan", tags:["bail","NDPS","speedy trial","Article 21"] },
  { _id:"j009", caseNumber:"Transfer Petition (Civil) 987/2023", caseTitle:"Rekha Devi v. Ramesh Prasad", court:"Supreme Court of India", courtLevel:"Supreme Court", bench:["Justice Hima Kohli","Justice Ahsanuddin Amanullah"], dateOfJudgment:"2023-12-20", year:2023, disposition:"Allowed", category:"Family - Matrimonial Disputes", acts:["Hindu Marriage Act, 1955","Code of Civil Procedure, 1908"], sections:["Section 25 CPC","Section 13B HMA"], headnotes:"Transfer of matrimonial case - Wife's convenience - Financial constraints.", fullText:"The wife cannot be expected to travel to the husband's city for every court hearing.", snippet:"In transfer petitions in matrimonial cases, the convenience of the wife is a primary consideration.", citedBy:[], citesTo:["j004"], district:"New Delhi", state:"Delhi", petitioner:"Rekha Devi", respondent:"Ramesh Prasad", tags:["transfer petition","matrimonial","wife convenience","child welfare"] },
  { _id:"j010", caseNumber:"ITA 2345/2022", caseTitle:"Commissioner of Income Tax v. Apex Industries Ltd", court:"Income Tax Appellate Tribunal", courtLevel:"High Court", bench:["Justice Member R.K. Panda"], dateOfJudgment:"2023-06-30", year:2023, disposition:"Dismissed", category:"Taxation", acts:["Income Tax Act, 1961"], sections:["Section 68","Section 143(3)","Section 147"], headnotes:"Reassessment under Section 147 - Unexplained cash credits under Section 68.", fullText:"The assessee failed to prove the identity, creditworthiness, and genuineness of the cash credits.", snippet:"Under Section 68, the assessee bears the onus to prove identity, creditworthiness and genuineness.", citedBy:[], citesTo:["CIT v. Lovely Exports (2008)"], district:"Kolkata", state:"West Bengal", petitioner:"Commissioner of Income Tax", respondent:"Apex Industries Ltd", tags:["income tax","reassessment","cash credits","Section 68"] },
  { _id:"j011", caseNumber:"WP(C) 4490/2023", caseTitle:"People's Union for Civil Liberties v. State of Madhya Pradesh", court:"Madhya Pradesh High Court", courtLevel:"High Court", bench:["Justice Ravi Malimath","Justice Vishal Mishra"], dateOfJudgment:"2024-01-30", year:2024, disposition:"Allowed", category:"Constitutional - Fundamental Rights", acts:["Constitution of India","Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act, 1989"], sections:["Article 14","Article 17","Article 21","Section 3 SC/ST Act"], headnotes:"Untouchability - Right to dignity - Compensation to victims.", fullText:"The State has a positive obligation under Article 17 read with Article 21 to prevent untouchability.", snippet:"The State bears a positive obligation under Articles 17 and 21 to prevent untouchability.", citedBy:[], citesTo:["State of Karnataka v. Appa Balu Ingale (1993)"], district:"Bhopal", state:"Madhya Pradesh", petitioner:"People's Union for Civil Liberties", respondent:"State of Madhya Pradesh", tags:["untouchability","fundamental rights","Article 17","SC/ST Act"] },
  { _id:"j012", caseNumber:"Arbitration Petition 112/2023", caseTitle:"National Highways Authority v. Progressive Constructions Ltd", court:"Delhi High Court", courtLevel:"High Court", bench:["Justice Vibhu Bakhru"], dateOfJudgment:"2024-02-28", year:2024, disposition:"Partly Allowed", category:"Commercial - Arbitration", acts:["Arbitration and Conciliation Act, 1996","Indian Contract Act, 1872"], sections:["Section 34","Section 37","Section 73 Contract Act"], headnotes:"Challenge to arbitral award - Patent illegality - Interest rate modified.", fullText:"The arbitral tribunal's finding on the breach of contract by NHAI is based on proper appreciation of evidence.", snippet:"Courts under Section 34 cannot sit in appeal over arbitral awards. Intervention is limited to patent illegality.", citedBy:[], citesTo:["Associate Builders v. DDA (2015)"], district:"New Delhi", state:"Delhi", petitioner:"National Highways Authority", respondent:"Progressive Constructions Ltd", tags:["arbitration","Section 34","patent illegality","interest rate"] },
];

const allJudgments = [...original, ...generated];
console.log(`📦 Total judgments to seed: ${allJudgments.length}`);

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas (cluster0.fn9o25.mongodb.net)");

    const db = client.db(DB_NAME);
    const collection = db.collection("judgments");

    // Clear existing
    const deleted = await collection.deleteMany({});
    console.log(`🗑  Cleared ${deleted.deletedCount} existing documents`);

    // Insert in batches
    let totalInserted = 0;
    for (let i = 0; i < allJudgments.length; i += BATCH_SIZE) {
      const batch = allJudgments.slice(i, i + BATCH_SIZE).map((j) => {
        const { _id, ...rest } = j;
        return { ...rest, sourceId: _id, indexedAt: new Date() };
      });
      const result = await collection.insertMany(batch);
      totalInserted += result.insertedCount;
      console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: inserted ${result.insertedCount} (total: ${totalInserted})`);
    }

    console.log(`\n✅ Successfully seeded ${totalInserted} judgments!`);

    // Seed synonyms
    const synonymsColl = db.collection("legal_synonyms");
    await synonymsColl.deleteMany({});
    await synonymsColl.insertMany([
      { mappingType: "equivalent", synonyms: ["divorce", "matrimonial dispute", "marriage dissolution", "separation"] },
      { mappingType: "equivalent", synonyms: ["murder", "homicide", "culpable homicide", "killing"] },
      { mappingType: "equivalent", synonyms: ["bail", "anticipatory bail", "regular bail", "default bail"] },
      { mappingType: "equivalent", synonyms: ["privacy", "right to privacy", "data protection", "digital surveillance"] },
      { mappingType: "equivalent", synonyms: ["environment", "pollution", "ecological", "green tribunal", "deforestation"] },
      { mappingType: "equivalent", synonyms: ["tax", "income tax", "taxation", "revenue", "GST"] },
      { mappingType: "equivalent", synonyms: ["labour", "employment", "industrial dispute", "retrenchment", "wages"] },
      { mappingType: "equivalent", synonyms: ["cyber crime", "hacking", "data theft", "online fraud", "phishing"] },
      { mappingType: "equivalent", synonyms: ["corruption", "bribery", "disproportionate assets", "money laundering"] },
      { mappingType: "equivalent", synonyms: ["insolvency", "bankruptcy", "IBC", "CIRP", "liquidation"] },
      { mappingType: "equivalent", synonyms: ["consumer", "deficiency of service", "unfair trade practice", "product liability"] },
      { mappingType: "equivalent", synonyms: ["reservation", "affirmative action", "OBC", "SC/ST", "quota"] },
      { mappingType: "equivalent", synonyms: ["rape", "sexual assault", "POCSO", "sexual offence"] },
      { mappingType: "equivalent", synonyms: ["contract", "breach of contract", "specific performance", "damages"] },
      { mappingType: "equivalent", synonyms: ["election", "election petition", "disqualification", "corrupt practices"] },
      { mappingType: "equivalent", synonyms: ["custody", "child custody", "guardianship", "visitation rights"] },
      { mappingType: "equivalent", synonyms: ["copyright", "trademark", "patent", "intellectual property"] },
      { mappingType: "equivalent", synonyms: ["arbitration", "arbitral award", "Section 34", "commercial dispute"] },
      { mappingType: "equivalent", synonyms: ["property", "land dispute", "title", "possession", "partition"] },
      { mappingType: "equivalent", synonyms: ["cheque bounce", "dishonour", "Section 138", "negotiable instrument"] },
    ]);
    console.log("✅ Seeded 20 synonym mappings");

    // Print summary
    const count = await collection.countDocuments();
    const categories = await collection.distinct("category");
    const states = await collection.distinct("state");
    const courtLevels = await collection.distinct("courtLevel");

    console.log("\n═══════════════════════════════════════");
    console.log("  📊 DATABASE SUMMARY");
    console.log("═══════════════════════════════════════");
    console.log(`  Database:     ${DB_NAME}`);
    console.log(`  Collection:   judgments`);
    console.log(`  Documents:    ${count}`);
    console.log(`  Categories:   ${categories.length}`);
    console.log(`  States:       ${states.length}`);
    console.log(`  Court Levels: ${courtLevels.join(", ")}`);
    console.log("═══════════════════════════════════════\n");

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await client.close();
    console.log("🔒 Connection closed");
  }
}

seed();
