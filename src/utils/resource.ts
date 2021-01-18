export interface Resource {
    id: number;
    category: string;
    course: string;
    year: string;
    title: string;
    index: number;
}

export interface ResourceWithLink extends Resource{
    path: string;
}
