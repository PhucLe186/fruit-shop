import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { DOMAIN_SERVER } from '../../../config/constants';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openPaymentDropdown, setOpenPaymentDropdown] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
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
      
      const res = await axios.get(`${DOMAIN_SERVER}/admin/order`, {
        params: params
      });
      
      if (res.data.success && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể tải danh sách đơn hàng',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  const statusMap = {
    pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Đang giao', color: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
  };

  const statusOptions = [
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipped', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  const paymentStatusMap = {
    pending: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800' },
    paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
    unpaid: { label: 'Chưa thanh toán', color: 'bg-red-100 text-red-800' },
    refunded: { label: 'Đã hoàn tiền', color: 'bg-blue-100 text-blue-800' },
    failed: { label: 'Thanh toán thất bại', color: 'bg-gray-100 text-gray-800' },
  };

  const paymentStatusOptions = [
    { value: 'pending', label: 'Đang xử lý' },
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'unpaid', label: 'Chưa thanh toán' },
    { value: 'refunded', label: 'Đã hoàn tiền' },
    { value: 'failed', label: 'Thanh toán thất bại' },
  ];

  const getStatusBadge = (status, orderId) => {
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const button = e.currentTarget;
            const rect = button.getBoundingClientRect();
            setOpenDropdown(openDropdown === orderId ? null : { orderId, top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
          }}
          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color} cursor-pointer hover:opacity-80 transition-opacity`}
        >
          {statusInfo.label}
          <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openDropdown && openDropdown.orderId === orderId && createPortal(
          <>
            <div
              className="fixed inset-0"
              onClick={() => setOpenDropdown(null)}
              style={{ backgroundColor: 'transparent', zIndex: 9998 }}
            />
            <div 
              className="fixed w-48 bg-white rounded-md shadow-xl border border-gray-200"
              style={{ 
                top: `${openDropdown.top + 4}px`,
                left: `${openDropdown.left}px`,
                maxHeight: '200px',
                overflowY: 'auto',
                minWidth: '180px',
                zIndex: 9999
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1 flex flex-col">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(orderId, option.value, status);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      status === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    );
  };

  const handleStatusChange = async (orderId, newStatus, currentStatus) => {
    setOpenDropdown(null);

    if (newStatus === currentStatus) {
      return;
    }

    const statusLabels = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      shipped: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
    };

    const result = await Swal.fire({
      title: 'Xác nhận thay đổi trạng thái',
      text: `Bạn có chắc chắn muốn thay đổi trạng thái đơn hàng từ "${statusLabels[currentStatus]}" sang "${statusLabels[newStatus]}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
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

        const res = await axios.patch(
          `${DOMAIN_SERVER}/admin/order/${orderId}/status-order`,
          { status: newStatus, _id: adminData._id }
        );

        if (res.data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: 'Trạng thái đơn hàng đã được cập nhật',
            confirmButtonText: 'OK',
            confirmButtonColor: '#28a745'
          });
          fetchOrders();
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: res.data.message || 'Không thể cập nhật trạng thái đơn hàng',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545'
          });
        }
      } catch (error) {
        console.error('Error updating order status:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: error.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  };

  const handlePaymentStatusChange = async (orderId, newPaymentStatus, currentPaymentStatus) => {
    setOpenPaymentDropdown(null);

    if (newPaymentStatus === currentPaymentStatus) {
      return;
    }

    const paymentStatusLabels = {
      pending: 'Đang xử lý',
      paid: 'Đã thanh toán',
      unpaid: 'Chưa thanh toán',
      refunded: 'Đã hoàn tiền',
      failed: 'Thanh toán thất bại',
    };

    const currentLabel = currentPaymentStatus ? paymentStatusLabels[currentPaymentStatus] || currentPaymentStatus : 'Chưa có';
    const newLabel = paymentStatusLabels[newPaymentStatus] || newPaymentStatus;

    const result = await Swal.fire({
      title: 'Xác nhận thay đổi trạng thái thanh toán',
      text: `Bạn có chắc chắn muốn thay đổi trạng thái thanh toán từ "${currentLabel}" sang "${newLabel}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
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

        const res = await axios.patch(
          `${DOMAIN_SERVER}/admin/order/${orderId}/payment-status`,
          { paymentStatus: newPaymentStatus, _id: adminData._id }
        );

        if (res.data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: 'Trạng thái thanh toán đã được cập nhật',
            confirmButtonText: 'OK',
            confirmButtonColor: '#28a745'
          });
          fetchOrders();
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: res.data.message || 'Không thể cập nhật trạng thái thanh toán',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545'
          });
        }
      } catch (error) {
        console.error('Error updating payment status:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: error.response?.data?.message || 'Không thể cập nhật trạng thái thanh toán',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  };

  const getPaymentStatusBadge = (paymentStatus, orderId) => {
    if (!paymentStatus) {
      return (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const button = e.currentTarget;
              const rect = button.getBoundingClientRect();
              setOpenPaymentDropdown(openPaymentDropdown === orderId ? null : { orderId, top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
            }}
            className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 cursor-pointer hover:opacity-80 transition-opacity"
          >
            Chưa có
            <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openPaymentDropdown && openPaymentDropdown.orderId === orderId && createPortal(
            <>
              <div
                className="fixed inset-0"
                onClick={() => setOpenPaymentDropdown(null)}
                style={{ backgroundColor: 'transparent', zIndex: 9998 }}
              />
              <div 
                className="fixed w-48 bg-white rounded-md shadow-xl border border-gray-200"
                style={{ 
                  top: `${openPaymentDropdown.top + 4}px`,
                  left: `${openPaymentDropdown.left}px`,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  minWidth: '180px',
                  zIndex: 9999
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1 flex flex-col">
                  {paymentStatusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePaymentStatusChange(orderId, option.value, paymentStatus);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        paymentStatus === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>,
            document.body
          )}
        </div>
      );
    }
    const statusInfo = paymentStatusMap[paymentStatus.toLowerCase()] || { label: paymentStatus, color: 'bg-gray-100 text-gray-800' };
    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const button = e.currentTarget;
            const rect = button.getBoundingClientRect();
            setOpenPaymentDropdown(openPaymentDropdown === orderId ? null : { orderId, top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
          }}
          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color} cursor-pointer hover:opacity-80 transition-opacity`}
        >
          {statusInfo.label}
          <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openPaymentDropdown && openPaymentDropdown.orderId === orderId && createPortal(
          <>
            <div
              className="fixed inset-0"
              onClick={() => setOpenPaymentDropdown(null)}
              style={{ backgroundColor: 'transparent', zIndex: 9998 }}
            />
            <div 
              className="fixed w-48 bg-white rounded-md shadow-xl border border-gray-200"
              style={{ 
                top: `${openPaymentDropdown.top + 4}px`,
                left: `${openPaymentDropdown.left}px`,
                maxHeight: '200px',
                overflowY: 'auto',
                minWidth: '180px',
                zIndex: 9999
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1 flex flex-col">
                {paymentStatusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePaymentStatusChange(orderId, option.value, paymentStatus);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      paymentStatus === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    const customerName = order.customer 
      ? (order.customer.fullname || order.customer.name || '')
      : (order.name || '');
    const customerEmail = order.customer 
      ? (order.customer.email || '')
      : (order.email || '');
    const customerPhone = order.customer 
      ? (order.customer.phone || '')
      : (order.phone || '');
    
    const matchesSearch = 
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
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
                <h2 className="text-2xl font-bold text-gray-900">Danh sách đơn hàng</h2>
                <p className="text-gray-600 mt-1">Quản lý các đơn hàng trong hệ thống</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={fetchOrders}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Đang tải...' : 'Tải lại'}
                </button>
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
                    placeholder="Tìm kiếm đơn hàng (tên, email, số điện thoại, mã đơn)..."
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
                  <option value="pending">Chờ xử lý</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="shipped">Đang giao</option>
                  <option value="delivered">Đã giao</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Không có đơn hàng</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Không tìm thấy đơn hàng phù hợp với bộ lọc'
                          : 'Chưa có đơn hàng nào trong hệ thống'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const customerName = order.customer 
                      ? (order.customer.fullname || order.customer.name || 'N/A')
                      : (order.name || 'Khách vãng lai');
                    const customerEmail = order.customer 
                      ? (order.customer.email || '')
                      : (order.email || '');
                    const customerPhone = order.customer 
                      ? (order.customer.phone || '')
                      : (order.phone || '');
                    
                    return (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{order._id.slice(-8).toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{customerName}</div>
                          {customerEmail && (
                            <div className="text-sm text-gray-500">{customerEmail}</div>
                          )}
                          {customerPhone && (
                            <div className="text-sm text-gray-500">{customerPhone}</div>
                          )}
                          {order.customer ? (
                            <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                              Đã đăng nhập
                            </span>
                          ) : (
                            <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800">
                              Khách vãng lai
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {Array.isArray(order.info_product) && order.info_product.length > 0 ? (
                              <div className="space-y-1">
                                {order.info_product.slice(0, 2).map((item, index) => (
                                  <div key={index}>
                                    {item.product ? (
                                      <div>
                                        <span className="font-medium">{item.product.name || 'N/A'}</span>
                                        <span className="text-gray-500"> x{item.quantity}</span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-500">Sản phẩm đã bị xóa</span>
                                    )}
                                  </div>
                                ))}
                                {order.info_product.length > 2 && (
                                  <div className="text-gray-500 text-xs">
                                    +{order.info_product.length - 2} sản phẩm khác
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">Không có sản phẩm</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(order.total)}
                          </div>
                          {order.discount && order.discount > 0 && (
                            <div className="text-sm text-gray-500">
                              Giảm: {formatPrice(order.discount)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ position: 'relative' }}>
                            {getStatusBadge(order.status, order._id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" style={{ position: 'relative', zIndex: 1 }}>
                          <div style={{ position: 'relative' }}>
                            <div className="space-y-1">
                              {getPaymentStatusBadge(order.paymentStatus, order._id)}
                              {order.paymentMethod && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {order.paymentMethod}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{filteredOrders.length}</span> đơn hàng
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;

