const PERMISSIONS = {
  SAN_PHAM: {
    XEM: "product:view",
    THEM: "product:create",
    SUA: "product:update",
    XOA: "product:delete",
  },
  DANH_MUC_SAN_PHAM: {
    XEM: "product_category:view",
    THEM: "product_category:create",
    SUA: "product_category:update",
    XOA: "product_category:delete",
  },
  KHACH_HANG: {
    XEM: "customer:view",
    THEM: "customer:create",
    SUA: "customer:update",
    XOA: "customer:delete",
  },
  KHUYEN_MAI: {
    XEM: "promotion:view",
    THEM: "promotion:create",
    SUA: "promotion:update",
    XOA: "promotion:delete",
  },
  TAI_KHOAN_QUAN_TRI: {
    XEM: "account_admin:view",
    THEM: "account_admin:create",
    SUA: "account_admin:update",
    XOA: "account_admin:delete",
  },
  DON_HANG: {
    XEM: "order:view",
    SUA: "order:update",
    XOA: "order:delete",
  },
  BANG_DIEU_KHIEN: {
    XEM: "dashboard:view",
  },
  NHOM_QUYEN: {
    XEM: "role:view",
    THEM: "role:create",
    SUA: "role:update",
    XOA: "role:delete",
  },
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS).reduce((acc, module) => {
  return [...acc, ...Object.values(module)];
}, []);

const PERMISSION_GROUPS = {
  ADMIN: [
    PERMISSIONS.SAN_PHAM.XEM,
    PERMISSIONS.SAN_PHAM.THEM,
    PERMISSIONS.SAN_PHAM.SUA,
    PERMISSIONS.SAN_PHAM.XOA,
    PERMISSIONS.DANH_MUC_SAN_PHAM.XEM,
    PERMISSIONS.DANH_MUC_SAN_PHAM.THEM,
    PERMISSIONS.DANH_MUC_SAN_PHAM.SUA,
    PERMISSIONS.DANH_MUC_SAN_PHAM.XOA,
    PERMISSIONS.KHACH_HANG.XEM,
    PERMISSIONS.KHACH_HANG.THEM,
    PERMISSIONS.KHACH_HANG.SUA,
    PERMISSIONS.KHACH_HANG.XOA,
    PERMISSIONS.KHUYEN_MAI.XEM,
    PERMISSIONS.KHUYEN_MAI.THEM,
    PERMISSIONS.KHUYEN_MAI.SUA,
    PERMISSIONS.KHUYEN_MAI.XOA,
    PERMISSIONS.TAI_KHOAN_QUAN_TRI.XEM,
    PERMISSIONS.TAI_KHOAN_QUAN_TRI.THEM,
    PERMISSIONS.TAI_KHOAN_QUAN_TRI.SUA,
    PERMISSIONS.TAI_KHOAN_QUAN_TRI.XOA,
    PERMISSIONS.DON_HANG.XEM,
    PERMISSIONS.DON_HANG.SUA,
    PERMISSIONS.DON_HANG.XOA,
    PERMISSIONS.BANG_DIEU_KHIEN.XEM,
  ],
  QUAN_LY_SAN_PHAM: [
    PERMISSIONS.SAN_PHAM.XEM,
    PERMISSIONS.SAN_PHAM.THEM,
    PERMISSIONS.SAN_PHAM.SUA,
    PERMISSIONS.SAN_PHAM.XOA,
    PERMISSIONS.DANH_MUC_SAN_PHAM.XEM,
    PERMISSIONS.DANH_MUC_SAN_PHAM.THEM,
    PERMISSIONS.DANH_MUC_SAN_PHAM.SUA,
    PERMISSIONS.DANH_MUC_SAN_PHAM.XOA,
    PERMISSIONS.BANG_DIEU_KHIEN.XEM,
  ],
  QUAN_LY_KHACH_HANG: [
    PERMISSIONS.KHACH_HANG.XEM,
    PERMISSIONS.KHACH_HANG.THEM,
    PERMISSIONS.KHACH_HANG.SUA,
    PERMISSIONS.KHACH_HANG.XOA,
    PERMISSIONS.DON_HANG.XEM,
    PERMISSIONS.BANG_DIEU_KHIEN.XEM,
  ],
  NGUOI_XEM: [
    PERMISSIONS.SAN_PHAM.XEM,
    PERMISSIONS.DANH_MUC_SAN_PHAM.XEM,
    PERMISSIONS.KHACH_HANG.XEM,
    PERMISSIONS.KHUYEN_MAI.XEM,
    PERMISSIONS.DON_HANG.XEM,
    PERMISSIONS.BANG_DIEU_KHIEN.XEM,
  ],
};

module.exports = {
  PERMISSIONS,
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
};

