export type Point = [number, number];

export interface BookObject {
  id: string;
  nameZh: string;
  textZh: string;
  audio: string;
  polygon: Point[];
}

export interface BookPage {
  pageId: string;
  width: number;
  height: number;
  objects: BookObject[];
}

export interface Book {
  bookId: string;
  title: string;
  defaultLanguage: string;
  pages: {
    pageId: string;
    title: string;
    image: string;
    data: string;
  }[];
}