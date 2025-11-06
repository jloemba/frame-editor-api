export interface ISongRef { id: number; }
export interface ISubSection { label: string; songs: ISongRef[]; }
export interface ISection { title: string; subSections?: ISubSection[]; songs?: ISongRef[]; }
export interface ISong { id: number; title: string; lyrics: string; author?: string; choir?: string; }
