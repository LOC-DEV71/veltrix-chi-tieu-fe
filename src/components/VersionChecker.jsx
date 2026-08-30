import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const VersionChecker = () => {
  useEffect(() => {
    let hasAlerted = false;

    const checkVersion = async () => {
      if (hasAlerted) return;
      try {
        const { data } = await api.get(`/system/version?t=${Date.now()}`);
        const serverVersion = data.version;
        const localVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

        if (serverVersion !== localVersion) {
          hasAlerted = true;
          Swal.fire({
            title: 'Phát hiện bản cập nhật mới!',
            html: `Phiên bản <b>v${serverVersion}</b> đã có sẵn (Bạn đang dùng v${localVersion}).<br/><br/>Đây là bản cập nhật <b>bảo mật quan trọng</b>. Vui lòng cập nhật ngay để bảo vệ dữ liệu!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Cập nhật ngay',
            cancelButtonText: 'Để sau',
            allowOutsideClick: false,
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.reload(true);
            } else {
              hasAlerted = false;
            }
          });
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra phiên bản:', error);
      }
    };

    checkVersion();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
};

export default VersionChecker;
