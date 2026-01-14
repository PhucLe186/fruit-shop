import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { DOMAIN_SERVER } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; tokenUser=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        await Swal.fire({
          icon: 'warning',
          title: 'Yêu cầu đăng nhập',
          text: 'Vui lòng đăng nhập để xem chi tiết đơn hàng',
          confirmButtonText: 'Đăng nhập',
          confirmButtonColor: '#3085d6'
        });
        navigate('/login');
        return;
      }

      const res = await axios.get(`${DOMAIN_SERVER}/api/order/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });

      if (res.data.success) {
        setOrder(res.data.data);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: res.data.message || 'Không thể tải chi tiết đơn hàng',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
        navigate('/orders');
      }
    } catch (error) {
      console.error('Error fetching order detail:', error);
      if (error.response?.status === 401) {
        await Swal.fire({
          icon: 'warning',
          title: 'Yêu cầu đăng nhập',
          text: 'Vui lòng đăng nhập để xem chi tiết đơn hàng',
          confirmButtonText: 'Đăng nhập',
          confirmButtonColor: '#3085d6'
        });
        navigate('/login');
      } else if (error.response?.status === 404 || error.response?.data?.message?.includes('không tồn tại')) {
        await Swal.fire({
          icon: 'error',
          title: 'Không tìm thấy',
          text: 'Đơn hàng không tồn tại',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
        navigate('/orders');
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: error.response?.data?.message || 'Không thể tải chi tiết đơn hàng',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
        navigate('/orders');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && user) {
      fetchOrderDetail();
    } else if (!user) {
      setLoading(false);
    }
  }, [id, user]);

  const statusMap = {
    pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
    confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800', icon: '✓' },
    shipped: { label: 'Đang giao', color: 'bg-purple-100 text-purple-800', icon: '🚚' },
    delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-800', icon: '✅' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: '❌' },
  };

  const paymentStatusMap = {
    pending: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800' },
    paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
    unpaid: { label: 'Chưa thanh toán', color: 'bg-red-100 text-red-800' },
    refunded: { label: 'Đã hoàn tiền', color: 'bg-blue-100 text-blue-800' },
    failed: { label: 'Thanh toán thất bại', color: 'bg-gray-100 text-gray-800' },
  };

  const paymentMethodMap = {
    cod: 'Thanh toán khi nhận hàng (COD)',
    bank: 'Chuyển khoản ngân hàng',
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Yêu cầu đăng nhập</h3>
            <p className="text-gray-500 mb-6">Vui lòng đăng nhập để xem chi tiết đơn hàng</p>
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

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy đơn hàng</h3>
            <p className="text-gray-500 mb-6">Đơn hàng không tồn tại hoặc bạn không có quyền xem</p>
            <Link
              to="/orders"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Quay lại danh sách đơn hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = statusMap[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800', icon: '' };
  const paymentStatusInfo = paymentStatusMap[order.paymentStatus] || { label: order.paymentStatus || 'N/A', color: 'bg-gray-100 text-gray-800' };

  return (
    <>
      <section className="breadcrumb-section pt-0">
        <div className="container-fluid-lg">
          <div className="row">
            <div className="col-12">
              <div className="breadcrumb-contain">
                <h2>Chi tiết đơn hàng</h2>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to="/">
                        <i className="fa-solid fa-house" />
                      </Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to="/orders">Đơn hàng</Link>
                    </li>
                    <li className="breadcrumb-item active">Chi tiết</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cart-section section-b-space">
        <div className="container-fluid-lg">
          <div className="row g-sm-5 g-3">
            <div className="col-xxl-9">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Đơn hàng #{order._id.slice(-8).toUpperCase()}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
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
                    <span className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full ${statusInfo.color}`}>
                      <span className="mr-2">{statusInfo.icon}</span>
                      {statusInfo.label}
                    </span>
                    <span className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full ${paymentStatusInfo.color}`}>
                      {paymentStatusInfo.label}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm đã đặt</h3>
                  <div className="space-y-4">
                    {Array.isArray(order.info_product) && order.info_product.length > 0 ? (
                      order.info_product.map((item, index) => (
                        <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0">
                          {item.product && item.product.images && item.product.images.length > 0 ? (
                            <img
                              src={item.product.images[0].url}
                              alt={item.product.name}
                              className="w-20 h-20 object-cover rounded-md border border-gray-200"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
                              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="text-base font-medium text-gray-900 mb-1">
                              {item.product ? (
                                <Link
                                  to={`/${item.product.slug}`}
                                  className="hover:text-blue-600 transition-colors"
                                >
                                  {item.product.name}
                                </Link>
                              ) : (
                                'Sản phẩm đã bị xóa'
                              )}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Số lượng: {item.quantity}</span>
                              <span>Đơn giá: {formatPrice(item.price)}</span>
                            </div>
                            {item.discount && item.discount > 0 && (
                              <p className="text-sm text-green-600 mt-1">
                                Giảm giá: {item.discount}%
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-base font-semibold text-gray-900">
                              {formatPrice((item.price || 0) * (item.quantity || 1))}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">Không có sản phẩm</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xxl-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h3>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Thông tin khách hàng</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Họ tên:</strong> {order.name || order.customer?.fullname || 'N/A'}</p>
                      <p><strong>Email:</strong> {order.email || order.customer?.email || 'N/A'}</p>
                      <p><strong>Số điện thoại:</strong> {order.phone || order.customer?.phone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Địa chỉ giao hàng</h4>
                    <p className="text-sm text-gray-600">{order.address || 'N/A'}</p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán</h4>
                    <p className="text-sm text-gray-600">
                      {paymentMethodMap[order.paymentMethod] || order.paymentMethod || 'N/A'}
                    </p>
                  </div>

                  {order.promotion && order.promotion.id && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Mã khuyến mãi</h4>
                      <div className="text-sm text-gray-600">
                        <p><strong>Mã:</strong> {order.promotion.code || 'N/A'}</p>
                        {order.promotion.name && (
                          <p><strong>Tên:</strong> {order.promotion.name}</p>
                        )}
                        {order.promotion.discount && (
                          <p className="text-green-600">
                            <strong>Giảm:</strong> {formatPrice(order.promotion.discount)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tạm tính:</span>
                      <span className="text-gray-900">
                        {formatPrice(
                          Array.isArray(order.info_product)
                            ? order.info_product.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
                            : 0
                        )}
                      </span>
                    </div>
                    {order.discount && order.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Giảm giá:</span>
                        <span className="text-green-600">-{formatPrice(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phí vận chuyển:</span>
                      <span className="text-gray-900">Miễn phí</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    to="/orders"
                    className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Quay lại danh sách đơn hàng
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default OrderDetail;

