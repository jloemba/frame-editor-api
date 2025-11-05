export interface ISongRef {
  id: number;
}
export interface ISection {
  title: string;
  songs: ISongRef[];
}

export interface ICultSheetData {
  title: string;
  date: string;
  sections: ISection[];
}