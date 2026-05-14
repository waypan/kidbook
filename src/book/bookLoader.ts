import { Book, BookPage } from './types';

export async function loadBook(): Promise<Book> {
  const response = await fetch('/book.json');
  return response.json();
}

export async function loadPage(dataPath: string): Promise<BookPage> {
  const response = await fetch(dataPath);
  return response.json();
}