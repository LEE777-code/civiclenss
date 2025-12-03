import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    LogOut,
    Search,
    Filter,
    CheckCircle,
    Clock,
    AlertTriangle,
    MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            // Fetch reports from Supabase (assuming you have a 'reports' table)
            // For now, we'll mock it or fetch from users if that's what you have
            // const { data, error } = await supabase.from('reports').select('*');

            // Mock data for demonstration
            setReports([
                { id: 1, title: 'Large Pothole', location: 'Anna Nagar', status: 'pending', severity: 'high', date: '2023-10-25' },
                { id: 2, title: 'Streetlight Broken', location: 'T Nagar', status: 'resolved', severity: 'medium', date: '2023-10-24' },
                { id: 3, title: 'Garbage Dump', location: 'Adyar', status: 'pending', severity: 'low', date: '2023-10-23' },
            ]);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching reports:', error);
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10 hidden md:block">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                        <LayoutDashboard /> CivicLens
                    </h1>
                </div>
                <nav className="p-4 space-y-1">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-blue-600 bg-blue-50 rounded-xl font-medium">
                        <FileText size={20} /> Reports
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">
                        <Users size={20} /> Citizens
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">
                        <Settings size={20} /> Settings
                    </button>
                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
                    >
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Report Management</h2>
                        <p className="text-gray-500">Overview of citizen submitted issues</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search reports..."
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <Filter size={20} className="text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <Clock className="text-amber-600" size={24} />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">12</span>
                        </div>
                        <p className="text-gray-500 font-medium">Pending Review</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <AlertTriangle className="text-blue-600" size={24} />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">5</span>
                        </div>
                        <p className="text-gray-500 font-medium">In Progress</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">28</span>
                        </div>
                        <p className="text-gray-500 font-medium">Resolved</p>
                    </div>
                </div>

                {/* Reports Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{report.title}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <MapPin size={16} />
                                                {report.location}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {report.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(report.severity)}`}>
                                                {report.severity.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">View Details</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
