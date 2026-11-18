import { useRouter } from 'next/router';
import { interviewsBase, canEditInterviews } from './interviewRoutes';

export default function useInterviewsBase() {
  const { pathname } = useRouter();
  const base = interviewsBase(pathname);
  return { base, canEdit: canEditInterviews(base) };
}
