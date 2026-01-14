import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { DOMAIN_SERVER } from '../../../config/constants';

const PromotionList = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const adminDataStr = localStorage.getItem('adminData');
      const params = {};
      
      if (adminDataStr) {
        const adminData = JSON.parse(adminDataStr);
        if (adminData._id) {
          params._id = adminData._id;
        }
      }
      
      const res = await axios.get(`${DOMAIN_SERVER}/admin/promotion`, {
        params: params
      });
      
      if (res.data.success && Array.isArray(res.data.data)) {
        setPromotions(res.data.data);
      } else {
        setPromotions([]);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotions([]);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể tải danh sách mã khuyến mãi',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, code) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa mã khuyến mãi "${code}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      const adminDataStr = localStorage.getItem('adminData');
      if (!adminDataStr) {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
        return;
      }

      const adminData = JSON.parse(adminDataStr);
      if (!adminData._id) {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Thông tin admin không hợp lệ. Vui lòng đăng nhập lại.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
        return;
      }

      try {
        const res = await axios.delete(`${DOMAIN_SERVER}/admin/promotion/${id}`, {
          data: { _id: adminData._id }
        });
        if (res.data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: 'Mã khuyến mãi đã được xóa',
            confirmButtonText: 'OK',
            confirmButtonColor: '#28a745'
          });
          fetchPromotions();
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: res.data.message || 'Không thể xóa mã khuyến mãi',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545'
          });
        }
      } catch (error) {
        console.error('Error deleting promotion:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: error.response?.data?.message || 'Không thể xóa mã khuyến mãi',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  };

  const handleChangeStatus = async (id, currentStatus) => {
    const adminDataStr = localStorage.getItem('adminData');
    if (!adminDataStr) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    const adminData = JSON.parse(adminDataStr);
    if (!adminData._id) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Thông tin admin không hợp lệ. Vui lòng đăng nhập lại.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    try {
      const res = await axios.patch(`${DOMAIN_SERVER}/admin/promotion/${id}/change-status`, {
        _id: adminData._id
      });
      if (res.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: res.data.message || 'Đã thay đổi trạng thái',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745',
          timer: 2000,
          timerProgressBar: true
        });
        fetchPromotions();
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: res.data.message || 'Không thể thay đổi trạng thái',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      console.error('Error changing status:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Không thể thay đổi trạng thái',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const isExpired = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const filteredPromotions = Array.isArray(promotions) ? promotions.filter(promotion => {
    const matchesSearch = 
      (promotion.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (promotion.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (promotion.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || promotion.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Danh sách mã khuyến mãi</h2>
                <p className="text-gray-600 mt-1">Quản lý các mã khuyến mãi trong hệ thống</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Link
                  to="/admin/promotion/create"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm mã khuyến mãi
                </Link>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm mã khuyến mãi (mã, tên, mô tả)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã khuyến mãi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày bắt đầu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày kết thúc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPromotions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Không có mã khuyến mãi</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Không tìm thấy mã khuyến mãi phù hợp với bộ lọc'
                          : 'Chưa có mã khuyến mãi nào trong hệ thống'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPromotions.map((promotion) => (
                    <tr key={promotion._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {promotion.code || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {promotion.name || '-'}
                        </div>
                        {promotion.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {promotion.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {promotion.discountType === 'percent' 
                            ? `${promotion.discountValue || 0}%`
                            : formatPrice(promotion.discountValue || 0)
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(promotion.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className={isExpired(promotion.endDate) ? 'text-red-600' : ''}>
                          {formatDate(promotion.endDate)}
                        </div>
                        {isExpired(promotion.endDate) && (
                          <div className="text-xs text-red-500">Đã hết hạn</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleChangeStatus(promotion._id, promotion.status)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                            promotion.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {promotion.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(promotion.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/promotion/${promotion._id}/update`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Sửa
                          </Link>
                          <button
                            onClick={() => handleDelete(promotion._id, promotion.code)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredPromotions.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{filteredPromotions.length}</span> mã khuyến mãi
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionList;

