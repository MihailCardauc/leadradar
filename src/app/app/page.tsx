import type { Metadata } from 'next';
import { App } from '../../ui/App';

export const metadata: Metadata = { title: 'LeadRadar · App' };

export default function Page() { return <App />; }
