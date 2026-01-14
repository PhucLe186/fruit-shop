import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import JustValidate from 'just-validate';
import Swal from 'sweetalert2';

const CreateCategory = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
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
        .addField('#name', [
          {
            rule: 'required',
            errorMessage: 'Tên danh mục không được để trống'
          },
          {
            rule: 'minLength',
            value: 3,
            errorMessage: 'Tên danh mục phải có ít nhất 3 ký tự'
          },
          {
            rule: 'maxLength',
            value: 100,
            errorMessage: 'Tên danh mục không được vượt quá 100 ký tự'
          }
        ])
        
    }

    return () => {
      if (validatorRef.current) {
        validatorRef.current.destroy();
      }
    };
  }, []);

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

    // Lấy thông tin admin từ localStorage
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
      // Thêm _id của admin vào request body
      const requestData = {
        ...formData,
        _id: adminData._id
      };
      
      const res = await axios.post('http://localhost:5000/admin/product/category/create', requestData);
      
      if (res.data.success === true) {
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Danh mục sản phẩm đã được thêm mới thành công',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745',
          timer: 3000,
          timerProgressBar: true
        });
        
        setFormData({
          name: '',
          description: '',
          status: 'active'
        });
        
        if (validatorRef.current) {
          validatorRef.current.refresh();
        }
      }
      else{
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: res.data.message,
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
        return;
      }
    } catch (error) {
      console.error('Error creating category:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Có lỗi xảy ra khi thêm danh mục. Vui lòng thử lại.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      status: 'active'
    });
    
    if (validatorRef.current) {
      validatorRef.current.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-white px-6 py-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thêm mới danh mục sản phẩm</h2>
            <p className="text-gray-600">Nhập thông tin danh mục sản phẩm mới</p>
          </div>
          
          <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Tên danh mục <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nhập tên danh mục sản phẩm"
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Nhập mô tả chi tiết về danh mục sản phẩm"
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                rows={5}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </span>
                ) : (
                  'Thêm danh mục'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Làm mới
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCategory;

