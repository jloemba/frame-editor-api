export interface ISongRef { id: number; choir?:string }
export interface ISubPart { label: string; songs: ISongRef[]; }
export interface IPart { title: string; subPart?: ISubPart[]; }
export interface ISong { id: number; title: string; lyrics: string; author?: string; choir?: string; }
export interface IFrame { id: string; title: string; eventDate: string; context: string; content: any; docUrl?: string; }
