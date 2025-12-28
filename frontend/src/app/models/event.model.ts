export interface Event {
    name: string;
    type: string;
    id: string;
    test: boolean;
    url: string;
    locale: string;
    images: Image[];
    sales: Sales;
    dates: Dates;
    classifications: Classification[];
    promoter: Promoter;
    links: EventLinks;
    _embedded: Embedded;
}

export interface Classification {
    primary: boolean;
    segment: Genre;
    genre: Genre;
    subGenre: Genre;
}

export interface Genre {
    id: string;
    name: string;
}

export interface Dates {
    start: Start;
    timezone: string;
    status: Status;
}

export interface Start {
    localDate: Date;
    dateTBD: boolean;
    dateTBA: boolean;
    timeTBA: boolean;
    noSpecificTime: boolean;
}

export interface Status {
    code: string;
}

export interface Embedded {
    venues: Venue[];
    attractions: Attraction[];
}

export interface Attraction {
    name: string;
    type: string;
    id: string;
    test: boolean;
    locale: string;
    images: Image[];
    classifications: Classification[];
    links: AttractionLinks;
}

export interface Image {
    ratio: Ratio;
    url: string;
    width: number;
    height: number;
    fallback: boolean;
}

export enum Ratio {
    The16_9 = "16_9",
    The3_2 = "3_2",
    The4_3 = "4_3",
}

export interface AttractionLinks {
    self: Self;
}

export interface Self {
    href: string;
}

export interface Venue {
    name: string;
    type: string;
    id: string;
    test: boolean;
    locale: string;
    postalCode: string;
    timezone: string;
    city: City;
    state: State;
    country: Country;
    address: Address;
    location: Location;
    markets: Promoter[];
    links: AttractionLinks;
}

export interface Address {
    line1: string;
}

export interface City {
    name: string;
}

export interface Country {
    name: string;
    countryCode: string;
}

export interface Location {
    longitude: string;
    latitude: string;
}

export interface Promoter {
    id: string;
}

export interface State {
    name: string;
    stateCode: string;
}

export interface EventLinks {
    self: Self;
    attractions: Self[];
    venues: Self[];
}

export interface Sales {
    public: Public;
}

export interface Public {
    startDateTime: Date;
    startTBD: boolean;
    endDateTime: Date;
}
