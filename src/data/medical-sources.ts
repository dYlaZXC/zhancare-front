export interface MedicalSource {
  id: string;
  title: string;
  organization: string;
  url: string;
  year?: number;
}

export const medicalSources: Record<string, MedicalSource> = {
  "who-cardiovascular": {
    id: "who-cardiovascular",
    title: "Cardiovascular diseases (CVDs)",
    organization: "World Health Organization (WHO)",
    url: "https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)",
    year: 2023,
  },
  "who-hypertension": {
    id: "who-hypertension",
    title: "Hypertension",
    organization: "World Health Organization (WHO)",
    url: "https://www.who.int/news-room/fact-sheets/detail/hypertension",
    year: 2023,
  },
  "who-headache": {
    id: "who-headache",
    title: "Headache disorders",
    organization: "World Health Organization (WHO)",
    url: "https://www.who.int/news-room/fact-sheets/detail/headache-disorders",
    year: 2023,
  },
  "who-fever": {
    id: "who-fever",
    title: "Fever: First aid",
    organization: "Mayo Clinic",
    url: "https://www.mayoclinic.org/first-aid/first-aid-fever/basics/art-20056685",
    year: 2024,
  },
  "medline-chest-pain": {
    id: "medline-chest-pain",
    title: "Chest Pain",
    organization: "MedlinePlus, U.S. National Library of Medicine",
    url: "https://medlineplus.gov/chestpain.html",
    year: 2024,
  },
  "medline-abdominal-pain": {
    id: "medline-abdominal-pain",
    title: "Abdominal Pain",
    organization: "MedlinePlus, U.S. National Library of Medicine",
    url: "https://medlineplus.gov/abdominalpain.html",
    year: 2024,
  },
  "kz-clinical-protocols": {
    id: "kz-clinical-protocols",
    title: "Клинические протоколы диагностики и лечения",
    organization: "Министерство здравоохранения Республики Казахстан",
    url: "https://diseases.medelement.com/",
    year: 2024,
  },
  "acc-aha-hypertension": {
    id: "acc-aha-hypertension",
    title: "2017 ACC/AHA High Blood Pressure Guidelines",
    organization: "American College of Cardiology / American Heart Association",
    url: "https://www.heart.org/en/health-topics/high-blood-pressure",
    year: 2022,
  },
  "aap-pediatrics": {
    id: "aap-pediatrics",
    title: "Pediatric Clinical Practice Guidelines",
    organization: "American Academy of Pediatrics",
    url: "https://www.healthychildren.org/",
    year: 2024,
  },
  "ihs-headache": {
    id: "ihs-headache",
    title: "International Classification of Headache Disorders (ICHD-3)",
    organization: "International Headache Society",
    url: "https://ichd-3.org/",
    year: 2022,
  },
};
