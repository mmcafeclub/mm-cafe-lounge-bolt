import { QueryClient } from '@tanstack/react-query';


const TWENTY_MINUTES = 20 * 60 * 1000;

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: TWENTY_MINUTES,
		},
	},
});