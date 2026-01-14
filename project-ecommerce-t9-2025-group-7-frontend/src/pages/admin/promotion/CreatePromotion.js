import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import JustValidate from 'just-validate';
import Swal from 'sweetalert2';
import { DOMAIN_SERVER } from '../../../config/constants';

const CreatePromotion = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percent',
    discountValue: '',
    minOrderValue: '',
    startDate: '',
    endDate: '',
    status: 'active'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const validatorRef = useRef(null);

  useEffect(() => {
    if (formRef.current) {
      validatorRef.current = new JustValidate(formRef.current, {
        errorFieldCssClass: 'is-invalid',
        errorLabelCssClass: 'invalid-feedback',
        successFieldCssClass: 'is-valid',
        focusInvalidField: true,
        lockForm: true,
      });

      validatorRef.current
        .addField('#code', [
          {
            rule: 'required',
            errorMessage: 'Mã khuyến mãi không được để trống'
          },
          {
            rule: 'minLength',
            value: 3,
            errorMessage: 'Mã khuyến mãi phải có ít nhất 3 ký tự'
          },
          {
            rule: 'maxLength',
            value: 50,
            errorMessage: 'Mã khuyến mãi không được vượt quá 50 ký tự'
          }
        ])
        .addField('#name', [
          {
            rule: 'required',
            errorMessage: 'Tên khuyến mãi không được để trống'
          },
          {
            rule: 'minLength',
            value: 3,
            errorMessage: 'Tên khuyến mãi phải có ít nhất 3 ký tự'
          }
        ])
        .addField('#discountValue', [
          {
            rule: 'required',
            errorMessage: 'Giá trị giảm giá không được để trống'
          },
          {
            rule: 'custom',
            validator: (value) => {
              const numValue = parseFloat(value);
              return !isNaN(numValue) && numValue > 0;
            },
            errorMessage: 'Giá trị giảm giá phải là số lớn hơn 0'
          }
        ])
        .addField('#startDate', [
          {
            rule: 'required',
            errorMessage: 'Ngày bắt đầu không được để trống'
          }
        ])
        .addField('#endDate', [
          {
            rule: 'required',
            errorMessage: 'Ngày kết thúc không được để trống'
          },
          {
            rule: 'custom',
            validator: (value) => {
              if (!formData.startDate) return true;
              return new Date(value) > new Date(formData.startDate);
            },
            errorMessage: 'Ngày kết thúc phải sau ngày bắt đầu'
          }
        ]);
    }

    return () => {
      if (validatorRef.current) {
        validatorRef.current.destroy();
      }
    };
  }, [formData.startDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatorRef.current) return;
    
    const isValid = await validatorRef.current.validate();
    if (!isValid) return;

    const adminDataStr = localStorage.getItem('adminData');
    if (!adminDataStr) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      navigate('/admin/login');
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
      navigate('/admin/login');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        _id: adminData._id
      };

      const res = await axios.post(`${DOMAIN_SERVER}/admin/promotion/create`, submitData);
      
      if (res.data.success === true) {
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Mã khuyến mãi đã được tạo thành công',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745',
          timer: 3000,
          timerProgressBar: true
        });
        
        navigate('/admin/promotion');
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: res.data.message || 'Tạo mã khuyến mãi thất bại',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Tạo mã khuyến mãi thất bại',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Thêm mã khuyến mãi mới</h2>
            <p className="text-gray-600 mt-1">Tạo mã khuyến mãi mới cho hệ thống</p>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Mã khuyến mãi <span className="text-red-500">*</span>
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="VD: SALE2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Tên khuyến mãi <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tên khuyến mãi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Mô tả về mã khuyến mãi"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 mb-2">
                  Loại giảm giá <span className="text-red-500">*</span>
                </label>
                <select
                  id="discountType"
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="amount">Số tiền (VND)</option>
                </select>
              </div>

              <div>
                <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 mb-2">
                  Giá trị giảm giá <span className="text-red-500">*</span>
                </label>
                <input
                  id="discountValue"
                  name="discountValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountValue}
                  onChange={handleChange}
                  placeholder={formData.discountType === 'percent' ? 'VD: 10' : 'VD: 50000'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.discountType === 'percent' ? 'Nhập phần trăm giảm giá (VD: 10 = 10%)' : 'Nhập số tiền giảm (VD: 50000 = 50,000 VND)'}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="minOrderValue" className="block text-sm font-medium text-gray-700 mb-2">
                Giá trị đơn hàng tối thiểu (VND)
              </label>
              <input
                id="minOrderValue"
                name="minOrderValue"
                type="number"
                min="0"
                value={formData.minOrderValue}
                onChange={handleChange}
                placeholder="VD: 100000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/admin/promotion')}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo mã khuyến mãi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePromotion;

