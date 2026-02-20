// hooks/useTags.ts (例)
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

interface Tag {
  id: string;
  name: string;
  slug: string;
  articleCount: number;
}

export const useTags = () => {
  return useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      // apiClient を使用 (baseURL が '/api' なのでパスは 'tags' でOK)
      const { data } = await apiClient.get('/tags');
      return data;
    },
  });
};