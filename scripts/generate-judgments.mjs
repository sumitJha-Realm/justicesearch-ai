// generate-judgments.mjs — Generates 1000 Indian legal judgments
import { writeFileSync } from "fs";

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function padId(n) { return String(n).padStart(4, "0"); }

const firstNames = ["Rajesh","Anita","Suresh","Priya","Vikram","Meena","Arun","Kavita","Deepak","Sunita","Manoj","Geeta","Ramesh","Savita","Amit","Neha","Rohit","Pooja","Sanjay","Ritu","Mohan","Lata","Ashok","Rekha","Vivek","Suman","Harsh","Nandini","Kiran","Usha","Ravi","Anjali","Pankaj","Swati","Dinesh","Madhuri","Sunil","Jaya","Arvind","Padma","Nitin","Seema","Pramod","Asha","Yogesh","Kamla","Rakesh","Veena","Gaurav","Shanti","Ajay","Laxmi","Vinod","Radha","Sachin","Durga","Naveen","Sarla","Tarun","Mala","Vijay","Kusum","Lalit","Bharti","Manish","Sarita","Mukesh","Shakuntala","Prem","Ganga","Sandeep","Champa","Hemant","Parvati","Girish","Rukmini","Satish","Indira","Naresh","Sushila","Baldev","Kamlesh","Gopal","Chandni","Hari","Tulsi","Om","Janaki","Dev","Pushpa","Krishan","Kamini","Chandra","Tara","Bharat","Manju","Mahesh","Nirmala","Shyam","Kanta"];
const lastNames = ["Sharma","Verma","Singh","Patel","Kumar","Gupta","Reddy","Nair","Joshi","Mehta","Yadav","Chauhan","Mishra","Pandey","Tiwari","Dubey","Srivastava","Saxena","Agarwal","Bansal","Kapoor","Malhotra","Bhatia","Chopra","Khanna","Sethi","Arora","Goel","Jain","Shah","Desai","Parekh","Gandhi","Iyer","Menon","Pillai","Rao","Naidu","Murthy","Hegde","Das","Sen","Bose","Ghosh","Mukherjee","Chatterjee","Banerjee","Roy","Saha","Dutta","Kaur","Gill","Sandhu","Bajwa","Dhillon","Sidhu","Bedi","Grewal","Randhawa","Chawla","Thakur","Rathore","Rajput","Chahar","Tanwar","Shekhawat","Bhatt","Trivedi","Dave","Vyas","Shukla","Dwivedi","Upadhyay","Tripathi","Awasthi","Kulkarni","Patil","Jadhav","More","Pawar","Shinde","Chavan","Gaikwad","Bhosle","Deshpande","Apte","Gokhale","Karnik","Sathe","Phadke","Pradhan","Mohanty","Patra","Sahoo","Behera","Swain","Nayak","Misra","Dash","Mohapatra","Jena"];

const states = [
  { state: "Maharashtra", districts: ["Mumbai","Pune","Nagpur","Nashik","Aurangabad","Thane","Solapur","Kolhapur","Amravati","Sangli"] },
  { state: "Delhi", districts: ["New Delhi","Central Delhi","South Delhi","North Delhi","East Delhi","West Delhi"] },
  { state: "Uttar Pradesh", districts: ["Lucknow","Allahabad","Varanasi","Kanpur","Agra","Meerut","Ghaziabad","Noida","Bareilly","Gorakhpur"] },
  { state: "Karnataka", districts: ["Bengaluru","Mysuru","Hubli","Mangaluru","Belgaum","Gulbarga","Shimoga","Tumkur","Davangere","Bellary"] },
  { state: "Tamil Nadu", districts: ["Chennai","Coimbatore","Madurai","Salem","Tiruchirappalli","Tirunelveli","Erode","Vellore","Thanjavur","Dindigul"] },
  { state: "West Bengal", districts: ["Kolkata","Howrah","Siliguri","Durgapur","Asansol","Bardhaman","Malda","Kharagpur","Haldia","Baharampur"] },
  { state: "Rajasthan", districts: ["Jaipur","Jodhpur","Udaipur","Kota","Ajmer","Bikaner","Alwar","Bhilwara","Sikar","Pali"] },
  { state: "Gujarat", districts: ["Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Junagadh","Gandhinagar","Anand","Nadiad"] },
  { state: "Madhya Pradesh", districts: ["Bhopal","Indore","Jabalpur","Gwalior","Ujjain","Sagar","Dewas","Satna","Ratlam","Rewa"] },
  { state: "Kerala", districts: ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kollam","Kannur","Alappuzha","Palakkad","Malappuram","Kottayam"] },
  { state: "Telangana", districts: ["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam","Ramagundam","Mahbubnagar","Nalgonda","Adilabad","Suryapet"] },
  { state: "Punjab", districts: ["Chandigarh","Ludhiana","Amritsar","Jalandhar","Patiala","Bathinda","Mohali","Pathankot","Hoshiarpur","Batala"] },
  { state: "Bihar", districts: ["Patna","Gaya","Muzaffarpur","Bhagalpur","Darbhanga","Purnia","Arrah","Begusarai","Katihar","Munger"] },
  { state: "Odisha", districts: ["Bhubaneswar","Cuttack","Rourkela","Berhampur","Sambalpur","Puri","Balasore","Bhadrak","Baripada","Jharsuguda"] },
  { state: "Assam", districts: ["Guwahati","Silchar","Dibrugarh","Jorhat","Nagaon","Tinsukia","Tezpur","Karimganj","Dhubri","Diphu"] },
  { state: "Haryana", districts: ["Chandigarh","Gurugram","Faridabad","Panipat","Ambala","Karnal","Rohtak","Hisar","Sonipat","Yamunanagar"] },
  { state: "Jharkhand", districts: ["Ranchi","Jamshedpur","Dhanbad","Bokaro","Deoghar","Hazaribagh","Giridih","Ramgarh","Dumka","Chaibasa"] },
  { state: "Chhattisgarh", districts: ["Raipur","Bhilai","Bilaspur","Korba","Durg","Rajnandgaon","Jagdalpur","Ambikapur","Raigarh","Dhamtari"] },
  { state: "Uttarakhand", districts: ["Dehradun","Haridwar","Haldwani","Roorkee","Kashipur","Rudrapur","Rishikesh","Pithoragarh","Almora","Nainital"] },
  { state: "Himachal Pradesh", districts: ["Shimla","Dharamshala","Mandi","Solan","Nahan","Bilaspur","Hamirpur","Una","Kullu","Chamba"] },
  { state: "Goa", districts: ["Panaji","Margao","Vasco da Gama","Mapusa","Ponda","Bicholim"] },
];

const justices = [
  "Justice D.Y. Chandrachud","Justice S.A. Nazeer","Justice J.B. Pardiwala","Justice Hima Kohli",
  "Justice B.R. Gavai","Justice Surya Kant","Justice Aniruddha Bose","Justice Vikram Nath",
  "Justice Sanjay Kishan Kaul","Justice Abhay S. Oka","Justice M.M. Sundresh","Justice Bela M. Trivedi",
  "Justice P.S. Narasimha","Justice Manoj Misra","Justice Aravind Kumar","Justice Sanjiv Khanna",
  "Justice C.T. Ravikumar","Justice Dipankar Datta","Justice Pankaj Mithal","Justice Ahsanuddin Amanullah",
  "Justice Prathiba M. Singh","Justice Arun Tandon","Justice Samit Gopal","Justice G.S. Patel",
  "Justice Krishna S. Dixit","Justice C.M. Joshi","Justice Vibhu Bakhru","Justice Adarsh Kumar Goel",
  "Justice Pankaj Bhandari","Justice R.K. Panda","Justice Ravi Malimath","Justice Vishal Mishra",
  "Justice Rajesh Bindal","Justice Sudhanshu Dhulia","Justice J.K. Maheshwari","Justice K.M. Joseph",
  "Justice Hemant Gupta","Justice Dinesh Maheshwari","Justice S. Ravindra Bhat","Justice A.S. Bopanna",
  "Justice Pamidighantam Sri Narasimha","Justice V. Ramasubramanian","Justice Indira Banerjee",
  "Justice Ajay Rastogi","Justice B.V. Nagarathna","Justice Nagarathna","Justice Sudhir Kumar Jain",
  "Justice Rajiv Shakdher","Justice Yashwant Varma","Justice Anup Jairam Bhambhani",
  "Justice Sanjeev Sachdeva","Justice Asha Menon","Justice Manoj Kumar Ohri","Justice Purushaindra Kumar Kaurav",
  "Justice Tushar Rao Gedela","Justice Mini Pushkarna","Justice Amit Bansal","Justice Dharmesh Sharma",
  "Justice Swarana Kanta Sharma","Justice Jasmeet Singh","Justice Neena Bansal Krishna",
];


const categories = [
  {
    category: "Criminal - Homicide",
    acts: ["Indian Penal Code, 1860","Code of Criminal Procedure, 1973","Indian Evidence Act, 1872"],
    sections: ["Section 302 IPC","Section 304 IPC","Section 304B IPC","Section 306 IPC","Section 299 IPC","Section 34 IPC","Section 120B IPC","Section 201 IPC","Section 27 Evidence Act","Section 313 CrPC"],
    tags: ["murder","homicide","culpable homicide","circumstantial evidence","eyewitness","death sentence","life imprisonment","Section 302","last seen theory","motive"],
    headnoteTemplates: [
      "Murder conviction based on {evidence_type} - {legal_principle} - Appeal {disposition_lower}.",
      "Culpable homicide not amounting to murder - {mitigating_factor} - Sentence {sentence_action}.",
      "Section 302 IPC - {evidence_type} established chain of guilt - {legal_principle}.",
      "Dowry death under Section 304B - Presumption under Section 113B Evidence Act - {disposition_action}.",
    ],
  },
  {
    category: "Criminal - Bail",
    acts: ["Code of Criminal Procedure, 1973","Narcotic Drugs and Psychotropic Substances Act, 1985","Indian Penal Code, 1860","Prevention of Money Laundering Act, 2002","Unlawful Activities (Prevention) Act, 1967"],
    sections: ["Section 437 CrPC","Section 438 CrPC","Section 439 CrPC","Section 436A CrPC","Section 37 NDPS Act","Section 43D(5) UAPA","Section 45 PMLA"],
    tags: ["bail","anticipatory bail","default bail","NDPS","speedy trial","Article 21","personal liberty","surety","remand","custody"],
    headnoteTemplates: [
      "Bail application - {offense_type} - {bail_factor} - Bail {bail_outcome}.",
      "Anticipatory bail under Section 438 CrPC - {legal_principle} - {disposition_action}.",
      "Default bail under Section 167(2) CrPC - Failure to file chargesheet within statutory period - {bail_outcome}.",
      "Bail in {special_act} case - {bail_factor} - Twin conditions of Section 37 - {bail_outcome}.",
    ],
  },
  {
    category: "Constitutional - Fundamental Rights",
    acts: ["Constitution of India","Right to Information Act, 2005","Information Technology Act, 2000","Protection of Human Rights Act, 1993"],
    sections: ["Article 14","Article 19(1)(a)","Article 19(1)(g)","Article 21","Article 21A","Article 25","Article 32","Article 226","Article 14","Article 15","Article 16"],
    tags: ["fundamental rights","Article 21","right to equality","free speech","right to life","privacy","dignity","Article 14","discrimination","writ petition"],
    headnoteTemplates: [
      "Fundamental rights under Article {article_num} - {rights_issue} - {legal_principle}.",
      "Writ petition under Article {writ_article} - {rights_issue} - State obligation {state_action}.",
      "Right to {right_type} as part of Article 21 - {legal_principle} - Directions issued.",
      "Violation of Article {article_num} - {discrimination_type} discrimination - {disposition_action}.",
    ],
  },
  {
    category: "Family - Matrimonial Disputes",
    acts: ["Hindu Marriage Act, 1955","Protection of Women from Domestic Violence Act, 2005","Special Marriage Act, 1954","Hindu Succession Act, 1956","Family Courts Act, 1984","Dowry Prohibition Act, 1961"],
    sections: ["Section 13(1)(ia) HMA","Section 13B HMA","Section 125 CrPC","Section 24 HMA","Section 12 PWDVA","Section 498A IPC","Section 304B IPC","Section 9 HMA"],
    tags: ["divorce","cruelty","dowry","maintenance","matrimonial","alimony","child custody","domestic violence","restitution","separation"],
    headnoteTemplates: [
      "Divorce on ground of {divorce_ground} - {legal_principle} - Marriage dissolved.",
      "Maintenance under Section 125 CrPC - {maintenance_factor} - Amount {amount_action}.",
      "Domestic violence - Protection order under PWDVA - {legal_principle} - {disposition_action}.",
      "Child custody - Welfare of the minor child paramount - {custody_factor} - Custody {custody_outcome}.",
    ],
  },
  {
    category: "Family - Child Custody",
    acts: ["Guardians and Wards Act, 1890","Hindu Minority and Guardianship Act, 1956","Juvenile Justice Act, 2015","Protection of Children from Sexual Offences Act, 2012"],
    sections: ["Section 7 GWA","Section 6 HMGA","Section 25 GWA","Section 13 HMGA","Section 3 POCSO","Section 5 POCSO"],
    tags: ["child custody","guardianship","welfare of child","visitation rights","parental rights","minor","POCSO","juvenile","child welfare","adoption"],
    headnoteTemplates: [
      "Child custody dispute - Welfare of child is paramount consideration - {custody_factor}.",
      "Guardianship under Section 7 GWA - {legal_principle} - {disposition_action}.",
      "POCSO case - Protection of minor victim - {legal_principle} - Conviction {disposition_lower}.",
      "Visitation rights of {parent_type} - Best interest of child - {disposition_action}.",
    ],
  },
  {
    category: "Commercial - Intellectual Property",
    acts: ["Copyright Act, 1957","Trade Marks Act, 1999","Patents Act, 1970","Information Technology Act, 2000","Indian Contract Act, 1872","Designs Act, 2000"],
    sections: ["Section 14 Copyright Act","Section 51 Copyright Act","Section 29 Trade Marks Act","Section 134 Trade Marks Act","Section 48 Patents Act","Section 64 Patents Act"],
    tags: ["copyright","trademark","patent","intellectual property","infringement","injunction","passing off","trade secret","software","design"],
    headnoteTemplates: [
      "{ip_type} infringement - {ip_principle} - Injunction {injunction_outcome}.",
      "Passing off action - Deceptive similarity of {ip_subject} - {legal_principle}.",
      "Patent validity challenge - {patent_issue} - Patent {patent_outcome}.",
      "{ip_type} registration dispute - Prior use established - {disposition_action}.",
    ],
  },
  {
    category: "Commercial - Arbitration",
    acts: ["Arbitration and Conciliation Act, 1996","Indian Contract Act, 1872","Specific Relief Act, 1963","Commercial Courts Act, 2015"],
    sections: ["Section 9","Section 11","Section 34","Section 37","Section 48","Section 73 Contract Act","Section 74 Contract Act"],
    tags: ["arbitration","Section 34","patent illegality","arbitral award","enforcement","public policy","commercial dispute","contract breach","damages","interim relief"],
    headnoteTemplates: [
      "Challenge to arbitral award under Section 34 - {arbitration_ground} - Award {award_outcome}.",
      "Appointment of arbitrator under Section 11 - {legal_principle} - {disposition_action}.",
      "Enforcement of foreign award under Section 48 - {enforcement_issue} - {disposition_action}.",
      "Interim measures under Section 9 - {urgency_factor} - Relief {relief_outcome}.",
    ],
  },
  {
    category: "Environmental Law",
    acts: ["Environment Protection Act, 1986","Water (Prevention and Control of Pollution) Act, 1974","Air (Prevention and Control of Pollution) Act, 1981","Forest Conservation Act, 1980","Wildlife Protection Act, 1972","National Green Tribunal Act, 2010"],
    sections: ["Section 3 EPA","Section 17 EPA","Section 24 Water Act","Section 21 Air Act","Section 2 FCA","Section 9 Wildlife Act","Section 15 NGT Act"],
    tags: ["pollution","environment","polluter pays","river contamination","air quality","deforestation","wildlife","green tribunal","climate","waste management"],
    headnoteTemplates: [
      "Industrial pollution - {pollution_type} - Polluter pays principle applied - {disposition_action}.",
      "Deforestation - Violation of Forest Conservation Act - {legal_principle} - Restoration ordered.",
      "Wildlife protection - {wildlife_issue} - {legal_principle} - {disposition_action}.",
      "Environmental clearance - {clearance_issue} - Precautionary principle - {disposition_action}.",
    ],
  },
  {
    category: "Taxation",
    acts: ["Income Tax Act, 1961","Goods and Services Tax Act, 2017","Central Excise Act, 1944","Customs Act, 1962","Wealth Tax Act, 1957"],
    sections: ["Section 68 IT Act","Section 143(3) IT Act","Section 147 IT Act","Section 148 IT Act","Section 263 IT Act","Section 271(1)(c) IT Act","Section 73 CGST","Section 74 CGST","Section 16 CGST"],
    tags: ["income tax","GST","reassessment","tax evasion","penalty","deduction","exemption","capital gains","TDS","transfer pricing"],
    headnoteTemplates: [
      "Reassessment under Section 147 - {tax_issue} - {legal_principle} - Addition {tax_outcome}.",
      "GST input tax credit - {gst_issue} - {legal_principle} - {disposition_action}.",
      "Penalty under Section 271(1)(c) - {penalty_issue} - {legal_principle} - Penalty {penalty_outcome}.",
      "Capital gains taxation - {cg_issue} - {legal_principle} - {disposition_action}.",
    ],
  },
  {
    category: "Property Disputes",
    acts: ["Transfer of Property Act, 1882","Registration Act, 1908","Indian Succession Act, 1925","Hindu Succession Act, 1956","Specific Relief Act, 1963","Benami Transactions Act, 1988"],
    sections: ["Section 54 TPA","Section 53A TPA","Section 106 TPA","Section 17 Registration Act","Section 8 HSA","Section 14 HSA","Section 6 Specific Relief Act"],
    tags: ["property","land dispute","title","possession","partition","succession","will","tenancy","eviction","encroachment"],
    headnoteTemplates: [
      "Title dispute - {title_issue} - {legal_principle} - Title {title_outcome}.",
      "Partition suit - {partition_issue} - Equal share of coparcenary property - {disposition_action}.",
      "Eviction proceedings - {eviction_ground} - {legal_principle} - Eviction {eviction_outcome}.",
      "Succession dispute - {succession_issue} - {legal_principle} - {disposition_action}.",
    ],
  },
  {
    category: "Labour and Employment",
    acts: ["Industrial Disputes Act, 1947","Payment of Wages Act, 1936","Employees Provident Fund Act, 1952","Factories Act, 1948","Payment of Gratuity Act, 1972","Workmen's Compensation Act, 1923"],
    sections: ["Section 2(s) ID Act","Section 10 ID Act","Section 11A ID Act","Section 25F ID Act","Section 25N ID Act","Section 33C(2) ID Act","Section 4 Gratuity Act"],
    tags: ["labour","employment","termination","reinstatement","wages","gratuity","retrenchment","industrial dispute","trade union","workmen compensation"],
    headnoteTemplates: [
      "Wrongful termination - {termination_issue} - Reinstatement with {back_wages} - {disposition_action}.",
      "Industrial dispute - {dispute_type} - Reference under Section 10 - {disposition_action}.",
      "Gratuity claim - {gratuity_issue} - {legal_principle} - {disposition_action}.",
      "Retrenchment under Section 25F - {retrenchment_issue} - Non-compliance - {disposition_action}.",
    ],
  },
  {
    category: "Criminal - Cyber Crime",
    acts: ["Information Technology Act, 2000","Indian Penal Code, 1860","Information Technology (Amendment) Act, 2008"],
    sections: ["Section 43 IT Act","Section 66 IT Act","Section 66A IT Act","Section 66C IT Act","Section 67 IT Act","Section 72 IT Act","Section 79 IT Act","Section 420 IPC"],
    tags: ["cyber crime","hacking","data theft","identity theft","phishing","online fraud","digital evidence","intermediary liability","social media","electronic records"],
    headnoteTemplates: [
      "Cyber fraud under Section 66 IT Act - {cyber_issue} - {legal_principle} - {disposition_action}.",
      "Data breach - {data_issue} - Intermediary liability under Section 79 - {disposition_action}.",
      "Online defamation - {defamation_issue} - Right to reputation vs free speech - {disposition_action}.",
      "Identity theft under Section 66C - {cyber_issue} - Digital evidence admissibility - {disposition_action}.",
    ],
  },
  {
    category: "Criminal - Economic Offences",
    acts: ["Prevention of Corruption Act, 1988","Prevention of Money Laundering Act, 2002","Companies Act, 2013","Indian Penal Code, 1860","Securities and Exchange Board of India Act, 1992"],
    sections: ["Section 7 PC Act","Section 13 PC Act","Section 3 PMLA","Section 4 PMLA","Section 45 PMLA","Section 420 IPC","Section 406 IPC","Section 409 IPC"],
    tags: ["corruption","money laundering","fraud","cheating","criminal breach of trust","disproportionate assets","bribery","PMLA","economic offence","proceeds of crime"],
    headnoteTemplates: [
      "Prevention of Corruption - {corruption_issue} - {legal_principle} - {disposition_action}.",
      "Money laundering under PMLA - {pmla_issue} - Proceeds of crime - {disposition_action}.",
      "Cheating and fraud under Section 420 IPC - {fraud_issue} - {legal_principle} - {disposition_action}.",
      "Corporate fraud - {corporate_issue} - {legal_principle} - {disposition_action}.",
    ],
  },
  {
    category: "Consumer Protection",
    acts: ["Consumer Protection Act, 2019","Consumer Protection Act, 1986","Real Estate (Regulation and Development) Act, 2016","Insurance Act, 1938"],
    sections: ["Section 2(7) CPA 2019","Section 35 CPA 2019","Section 47 CPA 2019","Section 58 CPA 2019","Section 18 RERA","Section 31 RERA"],
    tags: ["consumer","deficiency of service","unfair trade practice","product liability","medical negligence","insurance claim","RERA","housing","compensation","refund"],
    headnoteTemplates: [
      "Deficiency of service - {service_issue} - Compensation of Rs. {amount} awarded - {disposition_action}.",
      "Medical negligence - {medical_issue} - {legal_principle} - {disposition_action}.",
      "RERA complaint - {rera_issue} - Delayed possession - Refund with interest ordered.",
      "Insurance claim rejection - {insurance_issue} - {legal_principle} - {disposition_action}.",
    ],
  },
  {
    category: "Constitutional - Reservation",
    acts: ["Constitution of India","Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act, 1989","Right of Children to Free and Compulsory Education Act, 2009"],
    sections: ["Article 15(4)","Article 16(4)","Article 16(4A)","Article 46","Article 335","Article 340","Article 342","Section 3 SC/ST Act"],
    tags: ["reservation","OBC","SC/ST","affirmative action","equality","Article 16","creamy layer","EWS","backward classes","quota"],
    headnoteTemplates: [
      "Reservation policy - {reservation_issue} - Article 16(4) - {legal_principle} - {disposition_action}.",
      "SC/ST atrocity - {atrocity_issue} - {legal_principle} - Compensation awarded.",
      "OBC reservation - Creamy layer exclusion - {legal_principle} - {disposition_action}.",
      "EWS reservation - {ews_issue} - {legal_principle} - Constitutionality {constitutionality_outcome}.",
    ],
  },
  {
    category: "Criminal - Sexual Offences",
    acts: ["Indian Penal Code, 1860","Protection of Children from Sexual Offences Act, 2012","Code of Criminal Procedure, 1973","Indian Evidence Act, 1872"],
    sections: ["Section 376 IPC","Section 376D IPC","Section 354 IPC","Section 354A IPC","Section 509 IPC","Section 3 POCSO","Section 5 POCSO","Section 6 POCSO","Section 164 CrPC"],
    tags: ["sexual assault","rape","POCSO","molestation","harassment","victim testimony","consent","sexual harassment","workplace harassment","minor victim"],
    headnoteTemplates: [
      "Sexual assault under Section 376 - {sexual_offence_issue} - Victim testimony {testimony_outcome}.",
      "POCSO case - {pocso_issue} - Mandatory minimum sentence - {disposition_action}.",
      "Sexual harassment at workplace - {harassment_issue} - {legal_principle} - {disposition_action}.",
      "Consent - {consent_issue} - {legal_principle} - Conviction {disposition_lower}.",
    ],
  },
  {
    category: "Civil - Contract Disputes",
    acts: ["Indian Contract Act, 1872","Specific Relief Act, 1963","Sale of Goods Act, 1930","Indian Partnership Act, 1932","Limited Liability Partnership Act, 2008"],
    sections: ["Section 10 Contract Act","Section 23 Contract Act","Section 56 Contract Act","Section 73 Contract Act","Section 74 Contract Act","Section 14 Specific Relief","Section 16 Specific Relief"],
    tags: ["contract","breach","damages","specific performance","void agreement","consideration","frustration","liquidated damages","indemnity","guarantee"],
    headnoteTemplates: [
      "Breach of contract - {breach_issue} - Damages under Section 73 - {disposition_action}.",
      "Specific performance - {sp_issue} - {legal_principle} - Relief {relief_outcome}.",
      "Frustration of contract under Section 56 - {frustration_issue} - {legal_principle} - {disposition_action}.",
      "Void agreement under Section 23 - {void_issue} - {legal_principle} - {disposition_action}.",
    ],
  },
  {
    category: "Administrative Law",
    acts: ["Constitution of India","Administrative Tribunals Act, 1985","Right to Information Act, 2005","Central Civil Services Rules"],
    sections: ["Article 226","Article 227","Article 311","Article 14","Section 6 RTI Act","Section 8 RTI Act"],
    tags: ["administrative","judicial review","natural justice","writ","mandamus","certiorari","government service","transfer","promotion","disciplinary proceedings"],
    headnoteTemplates: [
      "Judicial review - {review_issue} - Principles of natural justice - {disposition_action}.",
      "Service matter - {service_issue} - {legal_principle} - {disposition_action}.",
      "RTI application - {rti_issue} - {legal_principle} - Information {info_outcome}.",
      "Disciplinary proceedings - {disciplinary_issue} - {legal_principle} - {disposition_action}.",
    ],
  },
  {
    category: "Banking and Finance",
    acts: ["Recovery of Debts and Bankruptcy Act, 1993","Securitisation and Reconstruction of Financial Assets Act, 2002","Insolvency and Bankruptcy Code, 2016","Reserve Bank of India Act, 1934","Negotiable Instruments Act, 1881"],
    sections: ["Section 7 IBC","Section 9 IBC","Section 10 IBC","Section 12A IBC","Section 29A IBC","Section 138 NI Act","Section 13 SARFAESI","Section 14 SARFAESI"],
    tags: ["insolvency","bankruptcy","IBC","SARFAESI","NPA","cheque bounce","CIRP","liquidation","resolution plan","financial creditor"],
    headnoteTemplates: [
      "IBC proceedings - {ibc_issue} - {legal_principle} - {disposition_action}.",
      "SARFAESI action - {sarfaesi_issue} - {legal_principle} - {disposition_action}.",
      "Cheque dishonour under Section 138 NI Act - {cheque_issue} - {legal_principle} - {disposition_action}.",
      "Resolution plan - {resolution_issue} - {legal_principle} - {disposition_action}.",
    ],
  },
  {
    category: "Election Law",
    acts: ["Representation of the People Act, 1951","Constitution of India","Election Commission of India Rules"],
    sections: ["Section 8 RPA","Section 9 RPA","Section 100 RPA","Section 123 RPA","Article 324","Article 329"],
    tags: ["election","election petition","disqualification","corrupt practices","EVM","nomination","recount","electoral fraud","defection","anti-defection"],
    headnoteTemplates: [
      "Election petition - {election_issue} - {legal_principle} - Election {election_outcome}.",
      "Disqualification under Section 8 RPA - {disqualification_issue} - {disposition_action}.",
      "Corrupt practices under Section 123 - {corrupt_issue} - {legal_principle} - {disposition_action}.",
      "Anti-defection - {defection_issue} - Tenth Schedule - {disposition_action}.",
    ],
  },
];

const courts = {
  "Supreme Court": [{ name: "Supreme Court of India", state: "Delhi" }],
  "High Court": [
    { name: "Bombay High Court", state: "Maharashtra" },
    { name: "Delhi High Court", state: "Delhi" },
    { name: "Allahabad High Court", state: "Uttar Pradesh" },
    { name: "Karnataka High Court", state: "Karnataka" },
    { name: "Madras High Court", state: "Tamil Nadu" },
    { name: "Calcutta High Court", state: "West Bengal" },
    { name: "Rajasthan High Court", state: "Rajasthan" },
    { name: "Gujarat High Court", state: "Gujarat" },
    { name: "Madhya Pradesh High Court", state: "Madhya Pradesh" },
    { name: "Kerala High Court", state: "Kerala" },
    { name: "Telangana High Court", state: "Telangana" },
    { name: "Punjab and Haryana High Court", state: "Punjab" },
    { name: "Patna High Court", state: "Bihar" },
    { name: "Orissa High Court", state: "Odisha" },
    { name: "Gauhati High Court", state: "Assam" },
    { name: "Jharkhand High Court", state: "Jharkhand" },
    { name: "Chhattisgarh High Court", state: "Chhattisgarh" },
    { name: "Uttarakhand High Court", state: "Uttarakhand" },
    { name: "Himachal Pradesh High Court", state: "Himachal Pradesh" },
    { name: "National Green Tribunal", state: "Delhi" },
    { name: "Income Tax Appellate Tribunal", state: "Delhi" },
  ],
  "District Court": [
    { name: "District and Sessions Court", state: null },
    { name: "Chief Metropolitan Magistrate Court", state: null },
    { name: "Additional District Judge Court", state: null },
    { name: "Family Court", state: null },
    { name: "Labour Court", state: null },
    { name: "Consumer Disputes Redressal Forum", state: null },
    { name: "Motor Accident Claims Tribunal", state: null },
  ],
};

const dispositions = ["Allowed", "Dismissed", "Partly Allowed", "Remanded"];
const caseTypePrefixes = {
  "Supreme Court": ["SLP(Crl.)","SLP(C)","WP(C)","WP(Crl.)","Transfer Petition (Civil)","Transfer Petition (Crl.)","CA","CrlA","Review Petition"],
  "High Court": ["WP(C)","WP(Crl.)","CrlA","FA","SA","CrlMC","CrlRevP","CS(Comm)","Arbitration Petition","ITA","BA","ABA","CWP","OA"],
  "District Court": ["SC","CC","CS","MAC","EP","GR","Sessions Trial","POCSO Case","NI Act Case"],
};

const citedCases = [
  "Maneka Gandhi v. Union of India (1978)","Kesavananda Bharati v. State of Kerala (1973)",
  "K.S. Puttaswamy v. Union of India (2017)","Vishaka v. State of Rajasthan (1997)",
  "Navtej Singh Johar v. Union of India (2018)","Indian Young Lawyers Assn v. State of Kerala (2018)",
  "S.R. Bommai v. Union of India (1994)","Indra Sawhney v. Union of India (1992)",
  "M.C. Mehta v. Union of India (1987)","Olga Tellis v. Bombay Municipal Corporation (1985)",
  "D.K. Basu v. State of West Bengal (1997)","Hussainara Khatoon v. Home Secretary, Bihar (1979)",
  "Bachan Singh v. State of Punjab (1980)","Shreya Singhal v. Union of India (2015)",
  "Shayara Bano v. Union of India (2017)","Joseph Shine v. Union of India (2018)",
  "ADM Jabalpur v. Shivkant Shukla (1976)","Minerva Mills v. Union of India (1980)",
  "Ashoka Kumar Thakur v. Union of India (2008)","Arnesh Kumar v. State of Bihar (2014)",
  "Lalita Kumari v. Govt. of UP (2014)","Sharad Birdhichand Sarda v. State of Maharashtra (1984)",
  "State of UP v. Deoman Upadhyaya (1960)","Tomaso Bruno v. State of UP (2015)",
  "Shri Bodhisattwa Gautam v. Miss Subhra Chakraborty (1996)","State of Punjab v. Gurmit Singh (1996)",
  "Dataram Singh v. State of UP (2018)","ONGC v. Saw Pipes (2003)",
  "Associate Builders v. DDA (2015)","Ssangyong Engineering v. NHAI (2019)",
  "Indian Council for Enviro-Legal Action v. Union of India (1996)","Vellore Citizens Forum v. Union of India (1996)",
  "CIT v. Lovely Exports (2008)","CIT v. Vatika Township (2015)",
  "Anuradha Bhasin v. Union of India (2020)","Internet and Mobile Assn of India v. RBI (2020)",
  "Mobilox Innovations v. Kirusa Software (2018)","Swiss Ribbons v. Union of India (2019)",
  "Pioneer Urban Land v. Union of India (2019)","Vidarbha Industries v. Axis Bank (2022)",
  "Committee of Creditors of Essar Steel v. Satish Kumar Gupta (2019)",
];


function generateFullText(cat, headnote, petitioner, respondent) {
  const paras = [
    `The matter before this Court arises from the dispute between ${petitioner} and ${respondent}.`,
    `After careful examination of the evidence on record, the submissions of learned counsel for both parties, and the applicable legal provisions, the Court proceeds to analyze the issues.`,
    headnote,
  ];
  const fillers = {
    "Criminal - Homicide": [
      "The prosecution has examined multiple witnesses to establish the chain of events leading to the fatal incident. The forensic evidence, including the post-mortem report and the recovery of the weapon, corroborates the prosecution's version of events.",
      "The defense has raised the plea of self-defense under Section 96 IPC, arguing that the accused acted in exercise of the right of private defense. However, the injuries inflicted were disproportionate to the apprehended threat.",
      "The dying declaration of the deceased, recorded by the Magistrate under Section 164 CrPC, is consistent with the prosecution's case and names the accused as the perpetrator.",
      "The medical evidence establishes that the cause of death was hemorrhagic shock due to multiple stab wounds. The time of death is consistent with the prosecution's timeline.",
      "This Court has consistently held that circumstantial evidence must form a complete chain leaving no room for any hypothesis consistent with the innocence of the accused.",
    ],
    "Criminal - Bail": [
      "The applicant has been in judicial custody and the investigation is substantially complete. The chargesheet has been filed and the trial is unlikely to conclude in the near future.",
      "Considering the nature of the offence, the evidence collected, the likelihood of the applicant fleeing from justice, and the possibility of tampering with evidence, this Court examines the bail application.",
      "The right to personal liberty under Article 21 of the Constitution is sacrosanct, and bail is the rule while jail is the exception. However, this principle must be balanced against the seriousness of the offence.",
      "The Supreme Court in Sanjay Chandra v. CBI (2012) has held that the purpose of bail is to ensure the appearance of the accused at the trial, and the detention in custody is not to be used as a means of punishment.",
    ],
    "Constitutional - Fundamental Rights": [
      "The Constitution of India guarantees fundamental rights to every citizen, and it is the duty of this Court to protect these rights against State action that is arbitrary, unreasonable, or violative of constitutional provisions.",
      "The test of proportionality requires that any restriction on fundamental rights must be proportionate to the legitimate aim pursued. The means employed must be rationally connected to the objective.",
      "The doctrine of basic structure, as laid down in Kesavananda Bharati v. State of Kerala, ensures that the fundamental character of the Constitution cannot be altered by any constitutional amendment.",
      "Article 21 has been expansively interpreted to include the right to live with dignity, the right to livelihood, the right to health, the right to education, and the right to a clean environment.",
    ],
    "Family - Matrimonial Disputes": [
      "The matrimonial relationship between the parties has broken down irretrievably. The evidence on record establishes a pattern of behavior that constitutes cruelty within the meaning of Section 13(1)(ia) of the Hindu Marriage Act.",
      "In matters of maintenance, the Court must consider the status of the parties, the reasonable wants of the claimant, the income and property of the respondent, and the number of persons the respondent is obligated to maintain.",
      "The welfare of the child is the paramount consideration in custody disputes, and the wishes of the child, though not determinative, must be given due weight depending on the age and maturity of the child.",
      "The Supreme Court in Naveen Kohli v. Neelu Kohli (2006) observed that irretrievable breakdown of marriage, though not a statutory ground, can be considered where it is just and proper to dissolve the marriage.",
    ],
  };
  const catFillers = fillers[cat.category] || [
    `The Court has carefully considered the arguments advanced by both parties. The legal provisions applicable to this case have been thoroughly analyzed in light of the precedents cited.`,
    `After examining the documentary and oral evidence on record, and considering the settled principles of law, this Court arrives at its conclusion.`,
    `The principles of natural justice require that no person shall be condemned unheard. Both parties have been given adequate opportunity to present their case before this Court.`,
    `This Court is mindful of the need to balance competing interests while ensuring that the ends of justice are served. The law must be applied in a manner that upholds the rule of law.`,
  ];
  paras.push(...pickN(catFillers, randInt(2, 3)));
  paras.push(`In view of the foregoing discussion, and for the reasons stated hereinabove, the ${pick(["appeal","petition","application","case"])} is ${pick(["allowed","dismissed","partly allowed","disposed of"])} in the terms indicated above.`);
  return paras.join(" ");
}

function generateJudgment(index) {
  const id = `j${padId(index + 13)}`; // start after existing 12
  const cat = pick(categories);
  const courtLevel = pick(["Supreme Court","High Court","High Court","High Court","District Court","District Court"]);
  const courtOptions = courts[courtLevel];
  const courtObj = pick(courtOptions);

  const stateObj = courtObj.state
    ? states.find(s => s.state === courtObj.state) || pick(states)
    : pick(states);
  const district = pick(stateObj.districts);
  const stateName = stateObj.state;
  const courtName = courtObj.state ? courtObj.name : `${courtObj.name}, ${district}`;

  const prefix = pick(caseTypePrefixes[courtLevel]);
  const caseNum = `${prefix} ${randInt(100, 9999)}/${randInt(2018, 2024)}`;

  const p1First = pick(firstNames);
  const p1Last = pick(lastNames);
  const r1First = pick(firstNames);
  const r1Last = pick(lastNames);

  const isStateCase = Math.random() > 0.5 && cat.category.startsWith("Criminal");
  const petitioner = isStateCase ? `State of ${stateName}` : `${p1First} ${p1Last}`;
  const respondent = isStateCase ? `${r1First} ${r1Last}` : (Math.random() > 0.6 ? `State of ${stateName}` : `${r1First} ${r1Last}`);
  const caseTitle = `${petitioner} v. ${respondent}`;

  const year = randInt(2018, 2024);
  const month = String(randInt(1, 12)).padStart(2, "0");
  const day = String(randInt(1, 28)).padStart(2, "0");
  const dateOfJudgment = `${year}-${month}-${day}`;

  const disposition = pick(dispositions);
  const benchSize = courtLevel === "Supreme Court" ? randInt(2, 3) : (courtLevel === "High Court" ? randInt(1, 2) : 1);
  const bench = pickN(justices, benchSize);

  const acts = pickN(cat.acts, randInt(2, Math.min(4, cat.acts.length)));
  const sections = pickN(cat.sections, randInt(2, Math.min(5, cat.sections.length)));
  const tags = pickN(cat.tags, randInt(3, Math.min(6, cat.tags.length)));

  const headnote = pick(cat.headnoteTemplates)
    .replace(/{[^}]+}/g, () => pick(tags));
  const fullText = generateFullText(cat, headnote, petitioner, respondent);
  const snippet = headnote + " " + fullText.split(". ").slice(2, 4).join(". ") + ".";

  const numCitedBy = randInt(0, 3);
  const citedByIds = Array.from({length: numCitedBy}, () => `j${padId(randInt(1, 1012))}`);
  const citesToCases = pickN(citedCases, randInt(1, 4));

  return {
    _id: id,
    caseNumber: caseNum,
    caseTitle,
    court: courtName,
    courtLevel,
    bench,
    dateOfJudgment,
    year,
    disposition,
    category: cat.category,
    acts,
    sections,
    headnotes: headnote,
    fullText,
    snippet,
    citedBy: citedByIds,
    citesTo: citesToCases,
    district,
    state: stateName,
    petitioner,
    respondent,
    tags,
  };
}

// Generate 1000 judgments
const judgments = [];
for (let i = 0; i < 1000; i++) {
  judgments.push(generateJudgment(i));
}

// Write as a TS-compatible JSON array
const output = JSON.stringify(judgments, null, 2);
writeFileSync("scripts/generated-judgments.json", output);
console.log(`Generated ${judgments.length} judgments -> scripts/generated-judgments.json`);

