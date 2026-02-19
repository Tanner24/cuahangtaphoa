
import React, { useState, useEffect } from 'react';
import { posService } from '../services/api';
import { ShieldAlert, ArrowLeft, Search, Calendar, History, Eye, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Logs = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterAction, setFilterAction] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchLogs();
    }, [page, filterAction, dateRange]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: 20,
                action: filterAction,
                startDate: dateRange.start,
                endDate: dateRange.end
            };
            const res = await posService.getLogs(params);
            setLogs(res.data);
            setTotalPages(res.meta.totalPages);
        } catch (error) {
            console.error('Fetch logs error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DELETE': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const formatDiff = (oldData, newData) => {
        if (!oldData && !newData) return null;
        try {
            const oldObj = oldData ? JSON.parse(oldData) : {};
            const newObj = newData ? JSON.parse(newData) : {};

            // Very basic diff display
            return (
                <div className="text-xs font-mono space-y-1">
                    {oldData && <div className="text-rose-600 line-through truncate max-w-xs" title={oldData}>Prev: {JSON.stringify(oldObj).substring(0, 50)}...</div>}
                    {newData && <div className="text-emerald-600 truncate max-w-xs" title={newData}>New: {JSON.stringify(newObj).substring(0, 50)}...</div>}
                </div>
            );
        } catch (e) { return <span className="text-xs text-slate-400">Data error</span> }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm transition-all text-slate-500 hover:text-blue-600">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <ShieldAlert className="text-rose-500" size={32} />
                                Nhật Ký Hệ Thống
                            </h1>
                            <p className="text-slate-500 font-medium text-sm mt-1">Truy vết mọi hoạt động thay đổi dữ liệu nhạy cảm</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Tất cả hành động</option>
                            <option value="UPDATE">Cập nhật (Update)</option>
                            <option value="DELETE">Xóa (Delete)</option>
                            <option value="CREATE">Tạo mới (Create)</option>
                        </select>
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input
                            type="date"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input
                            type="date"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-black">
                                    <th className="p-6">Thời gian</th>
                                    <th className="p-6">Người thực hiện</th>
                                    <th className="p-6 text-center">Hành động</th>
                                    <th className="p-6">Đối tượng</th>
                                    <th className="p-6">Chi tiết thay đổi</th>
                                    <th className="p-6">IP / Thiết bị</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-20 text-center text-slate-400 animate-pulse font-bold">Đang tải dữ liệu...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan="6" className="p-20 text-center text-slate-400 font-bold">Chưa có nhật ký nào</td></tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="p-6 font-bold text-slate-700 text-sm whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                        <User size={14} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-sm">{log.user?.fullName || 'Hệ thống'}</div>
                                                        <div className="text-xs text-slate-400 font-medium">@{log.user?.username || 'system'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <span className="font-bold text-slate-700 block">{log.entity}</span>
                                                <span className="text-xs font-mono text-slate-400">ID: {log.entityId}</span>
                                            </td>
                                            <td className="p-6 min-w-[300px]">
                                                {formatDiff(log.oldData, log.newData)}
                                            </td>
                                            <td className="p-6 text-xs text-slate-500 font-medium max-w-[150px] truncate">
                                                <div>IP: {log.ipAddress}</div>
                                                <div className="truncate text-[10px] text-slate-400">{log.device}</div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trang {page} / {totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
                            >
                                Trước
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Logs;
