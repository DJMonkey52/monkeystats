import PlayerDashboard from '@/components/PlayerDashboard';

export const dynamic = 'force-dynamic';
export default function PlayerPage({params}:{params:{steamid64:string}}){
  return <PlayerDashboard steamid64={params.steamid64}/>;
}
