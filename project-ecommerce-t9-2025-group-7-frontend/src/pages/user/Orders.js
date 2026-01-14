import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { DOMAIN_SERVER } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const getToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; tokenUser=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        await Swal.fire({
          icon: 'warning',
          title: 'Yêu cầu đăng nhập',
          text: 'Vui lòng đăng nhập để xem đơn hàng',
          confirmButtonText: 'Đăng nhập',
          confirmButtonColor: '#3085d6'
        });
        navigate('/login');
        return;
      }

      const params = {
        page: page,
        limit: 10
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (paymentStatusFilter) {
        params.paymentStatus = paymentStatusFilter;
      }

      const res = await axios.get(`${DOMAIN_SERVER}/api/order/`, {
        params: params,
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });

      if (res.data.success) {
        setOrders(res.data.data || []);
        setPagination(res.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        });
      } else {
        setOrders([]);
        if (res.data.message && res.data.message.includes('đăng nhập')) {
          await Swal.fire({
            icon: 'warning',
            title: 'Yêu cầu đăng nhập',
            text: res.data.message,
            confirmButtonText: 'Đăng nhập',
            confirmButtonColor: '#3085d6'
          });
          navigate('/login');
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      if (error.response?.status === 401) {
        await Swal.fire({
          icon: 'warning',
          title: 'Yêu cầu đăng nhập',
          text: 'Vui lòng đăng nhập để xem đơn hàng',
          confirmButtonText: 'Đăng nhập',
          confirmButtonColor: '#3085d6'
        });
        navigate('/login');
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: error.response?.data?.message || 'Không thể tải danh sách đơn hàng',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [page, statusFilter, paymentStatusFilter, user]);

  const statusMap = {
    pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Đang giao', color: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
  };

  const paymentStatusMap = {
    pending: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800' },
    paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
    unpaid: { label: 'Chưa thanh toán', color: 'bg-red-100 text-red-800' },
    refunded: { label: 'Đã hoàn tiền', color: 'bg-blue-100 text-blue-800' },
    failed: { label: 'Thanh toán thất bại', color: 'bg-gray-100 text-gray-800' },
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  useEffect(() => {
    handleFilterChange();
  }, [statusFilter, paymentStatusFilter]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Yêu cầu đăng nhập</h3>
            <p className="text-gray-500 mb-6">Vui lòng đăng nhập để xem đơn hàng của bạn</p>
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
    <>
      <section className="breadcrumb-section pt-0">
        <div className="container-fluid-lg">
          <div className="row">
            <div className="col-12">
              <div className="breadcrumb-contain">
                <h2>Đơn hàng của tôi</h2>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to="/">
                        <i className="fa-solid fa-house" />
                      </Link>
                    </li>
                    <li className="breadcrumb-item active">Đơn hàng</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cart-section section-b-space">
        <div className="container-fluid-lg">
          <div className="row">
            <div className="col-12">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Danh sách đơn hàng</h2>
                  <p className="text-gray-600 mt-1">Xem và theo dõi đơn hàng của bạn</p>
                </div>

                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="sm:w-48">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái đơn hàng
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Tất cả</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="shipped">Đang giao</option>
                        <option value="delivered">Đã giao</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                    <div className="sm:w-48">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái thanh toán
                      </label>
                      <select
                        value={paymentStatusFilter}
                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Tất cả</option>
                        <option value="pending">Đang xử lý</option>
                        <option value="paid">Đã thanh toán</option>
                        <option value="unpaid">Chưa thanh toán</option>
                        <option value="refunded">Đã hoàn tiền</option>
                        <option value="failed">Thanh toán thất bại</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đơn hàng</h3>
                      <p className="text-gray-500 mb-6">
                        {statusFilter || paymentStatusFilter
                          ? 'Không tìm thấy đơn hàng phù hợp với bộ lọc'
                          : 'Bạn chưa có đơn hàng nào'}
                      </p>
                      <Link
                        to="/"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                      >
                        Mua sắm ngay
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const statusInfo = statusMap[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800' };
                        const paymentStatusInfo = paymentStatusMap[order.paymentStatus] || { label: order.paymentStatus || 'N/A', color: 'bg-gray-100 text-gray-800' };
                        
                        return (
                          <div
                            key={order._id}
                            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                      Đơn hàng #{order._id.slice(-8).toUpperCase()}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                                      {statusInfo.label}
                                    </span>
                                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${paymentStatusInfo.color}`}>
                                      {paymentStatusInfo.label}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                  {Array.isArray(order.info_product) && order.info_product.length > 0 ? (
                                    order.info_product.slice(0, 3).map((item, index) => (
                                      <div key={index} className="flex items-center gap-3">
                                        {item.product && item.product.images && item.product.images.length > 0 ? (
                                          <img
                                            src={item.product.images[0].url}
                                            alt={item.product.name}
                                            className="w-16 h-16 object-cover rounded-md border border-gray-200"
                                          />
                                        ) : (
                                          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                          </div>
                                        )}
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900">
                                            {item.product ? item.product.name : 'Sản phẩm đã bị xóa'}
                                          </p>
                                          <p className="text-sm text-gray-500">
                                            Số lượng: {item.quantity} x {formatPrice(item.price)}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-gray-500">Không có sản phẩm</p>
                                  )}
                                  {order.info_product && order.info_product.length > 3 && (
                                    <p className="text-sm text-gray-500">
                                      +{order.info_product.length - 3} sản phẩm khác
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                  <div>
                                    <p className="text-sm text-gray-600">Tổng tiền:</p>
                                    <p className="text-xl font-bold text-blue-600">
                                      {formatPrice(order.total)}
                                    </p>
                                    {order.discount && order.discount > 0 && (
                                      <p className="text-sm text-gray-500">
                                        Đã giảm: {formatPrice(order.discount)}
                                      </p>
                                    )}
                                  </div>
                                  <Link
                                    to={`/orders/${order._id}`}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                                  >
                                    Xem chi tiết
                                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {pagination.totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trước
                      </button>
                      <span className="px-4 py-2 text-sm text-gray-700">
                        Trang {pagination.page} / {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === pagination.totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Orders;

