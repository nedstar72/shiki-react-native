import { InferOutput, minLength, object, pipe, string, url } from 'valibot';

export const AnimeSchema = object({
  id: pipe(string(), minLength(1, 'id is required')),
  name: pipe(string(), minLength(1, 'name is required')),
  url: pipe(string(), minLength(1, 'url is required'), url('url must be valid')),
});

export type Anime = InferOutput<typeof AnimeSchema>;
