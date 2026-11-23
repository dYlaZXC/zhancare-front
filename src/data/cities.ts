export interface CityData {
  slug: string;
  name: string;        // Алматы
  nameIn: string;      // в Алматы
  nameOf: string;      // Алматы (родит. падеж — врачей Алматы)
  region: string;
  population: string;
  description: string;
  clinicsCount: string;
}

export const cities: Record<string, CityData> = {
  almaty: {
    slug: "almaty",
    name: "Алматы",
    nameIn: "в Алматы",
    nameOf: "Алматы",
    region: "г. Алматы",
    population: "2,2 млн",
    description:
      "Алматы — крупнейший город Казахстана, финансовый и медицинский центр страны. Здесь сосредоточено более 60% частных клиник республики и ведущие специалисты по всем профилям.",
    clinicsCount: "400+",
  },
  astana: {
    slug: "astana",
    name: "Астана",
    nameIn: "в Астане",
    nameOf: "Астаны",
    region: "г. Астана",
    population: "1,4 млн",
    description:
      "Астана — столица Казахстана и быстро растущий медицинский центр. В городе активно развивается сеть частных и государственных клиник.",
    clinicsCount: "200+",
  },
  shymkent: {
    slug: "shymkent",
    name: "Шымкент",
    nameIn: "в Шымкенте",
    nameOf: "Шымкента",
    region: "г. Шымкент",
    population: "1,1 млн",
    description:
      "Шымкент — третий по величине город Казахстана с развитой медицинской инфраструктурой юга страны.",
    clinicsCount: "150+",
  },
};

// Cities enabled for static generation (expand as city pages are filled)
export const ACTIVE_CITIES = ["almaty"];
