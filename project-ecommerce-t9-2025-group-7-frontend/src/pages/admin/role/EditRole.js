import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import JustValidate from 'just-validate';
import Swal from 'sweetalert2';
import { DOMAIN_SERVER } from '../../../config/constants';

const EditRole = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    permissions: []
  });

  const [permissionsData, setPermissionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const validatorRef = useRef(null);

  useEffect(() => {
    fetchPermissions();
    fetchRole();
  }, [id]);

  useEffect(() => {
    if (formRef.current && !loading) {
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
            errorMessage: 'Tên nhóm quyền không được để trống'
          },
          {
            rule: 'minLength',
            value: 3,
            errorMessage: 'Tên nhóm quyền phải có ít nhất 3 ký tự'
          },
          {
            rule: 'maxLength',
            value: 100,
            errorMessage: 'Tên nhóm quyền không được vượt quá 100 ký tự'
          }
        ]);
    }

    return () => {
      if (validatorRef.current) {
        validatorRef.current.destroy();
      }
    };
  }, [loading]);

  const fetchPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const res = await axios.get(`${DOMAIN_SERVER}/admin/role/permissions`);
      
      if (res.data.success && Array.isArray(res.data.data)) {
        setPermissionsData(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const fetchRole = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${DOMAIN_SERVER}/admin/role/${id}`);
      if (res.data.permission === false) {
        await Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: "Bạn không có quyền truy cập trang này",
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
        navigate(-1);
        return;
      }
      if (res.data.success && res.data.data) {
        const role = res.data.data;
        setFormData({
          name: role.name || '',
          description: role.description || '',
          status: role.status || 'active',
          permissions: Array.isArray(role.permissions) ? role.permissions : []
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: res.data.message || 'Không thể tải thông tin nhóm quyền',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
        navigate('/admin/role');
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể tải thông tin nhóm quyền',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      navigate('/admin/role');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (permissionValue, checked) => {
    setFormData(prev => {
      const permissions = [...prev.permissions];
      if (checked) {
        if (!permissions.includes(permissionValue)) {
          permissions.push(permissionValue);
        }
      } else {
        const index = permissions.indexOf(permissionValue);
        if (index > -1) {
          permissions.splice(index, 1);
        }
      }
      return {
        ...prev,
        permissions
      };
    });
  };

  const handleModuleToggle = (modulePermissions, checked) => {
    setFormData(prev => {
      const permissions = [...prev.permissions];
      const permissionValues = modulePermissions.map(p => p.value);
      
      if (checked) {
        permissionValues.forEach(value => {
          if (!permissions.includes(value)) {
            permissions.push(value);
          }
        });
      } else {
        permissionValues.forEach(value => {
          const index = permissions.indexOf(value);
          if (index > -1) {
            permissions.splice(index, 1);
          }
        });
      }
      return {
        ...prev,
        permissions
      };
    });
  };

  const isModuleChecked = (modulePermissions) => {
    const permissionValues = modulePermissions.map(p => p.value);
    return permissionValues.every(value => formData.permissions.includes(value));
  };

  const isModuleIndeterminate = (modulePermissions) => {
    const permissionValues = modulePermissions.map(p => p.value);
    const checkedCount = permissionValues.filter(value => formData.permissions.includes(value)).length;
    return checkedCount > 0 && checkedCount < permissionValues.length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatorRef.current) return;
    
    const isValid = await validatorRef.current.validate();
    if (!isValid) return;

    if (!formData.permissions || formData.permissions.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Cảnh báo!',
        text: 'Vui lòng chọn ít nhất một quyền',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

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
      const requestData = {
        ...formData,
        _id: adminData._id
      };
      const res = await axios.patch(`${DOMAIN_SERVER}/admin/role/${id}`, requestData);
      
      if (res.data.success === true) {
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Nhóm quyền đã được cập nhật thành công',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745',
          timer: 3000,
          timerProgressBar: true
        });
        
        navigate('/admin/role');
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: res.data.message,
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật nhóm quyền. Vui lòng thử lại.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    fetchRole();
    
    if (validatorRef.current) {
      validatorRef.current.refresh();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-white px-6 py-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cập nhật nhóm quyền</h2>
            <p className="text-gray-600">Chỉnh sửa thông tin nhóm quyền</p>
          </div>
          
          <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Tên nhóm quyền <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nhập tên nhóm quyền"
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                autoComplete="off"
              />
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
                placeholder="Nhập mô tả về nhóm quyền"
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                rows={4}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quyền <span className="text-red-500">*</span>
              </label>
              {loadingPermissions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-md p-4 max-h-96 overflow-y-auto bg-gray-50">
                  {permissionsData.map((module) => (
                    <div key={module.module} className="mb-4 last:mb-0">
                      <div className="flex items-center mb-2 pb-2 border-b border-gray-300">
                        <input
                          type="checkbox"
                          id={`module-${module.module}`}
                          checked={isModuleChecked(module.permissions)}
                          ref={(input) => {
                            if (input) {
                              input.indeterminate = isModuleIndeterminate(module.permissions);
                            }
                          }}
                          onChange={(e) => handleModuleToggle(module.permissions, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`module-${module.module}`} className="ml-2 text-sm font-semibold text-gray-900 cursor-pointer">
                          {module.label}
                        </label>
                      </div>
                      <div className="ml-6 space-y-2">
                        {module.permissions.map((permission) => (
                          <div key={permission.value} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`permission-${permission.value}`}
                              checked={formData.permissions.includes(permission.value)}
                              onChange={(e) => handlePermissionChange(permission.value, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`permission-${permission.value}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                              {permission.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {formData.permissions.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  Đã chọn: <span className="font-medium">{formData.permissions.length}</span> quyền
                </p>
              )}
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
                  'Cập nhật nhóm quyền'
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

export default EditRole;

