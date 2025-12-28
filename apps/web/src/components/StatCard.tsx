import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    alert?: boolean;
}

export default function StatCard({ title, value, icon: Icon, trend, trendValue, alert }: StatCardProps) {
    return (
        <div className={`p-6 bg-white rounded-xl border ${alert ? 'border-red-200 bg-red-50/30' : 'border-stone-100'} shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow duration-300`}>
            <div className="flex justify-between items-start">
                <div className={`p-2 rounded-lg ${alert ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-600'}`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <div className={`flex items-center text-xs font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-stone-400'
                        }`}>
                        {trendValue}
                        {trend === 'up' && <ArrowUpRight size={14} className="ml-0.5" />}
                        {trend === 'down' && <ArrowDownRight size={14} className="ml-0.5" />}
                        {trend === 'neutral' && <Minus size={14} className="ml-0.5" />}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-2xl font-bold text-stone-900 tracking-tight">{value}</h3>
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mt-1">{title}</p>
            </div>
        </div>
    );
}
