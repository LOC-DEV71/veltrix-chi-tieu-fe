import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const VersionChecker = () => {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const { data } = await api.get('/system/version');
        const serverVersion = data.version;
        const localVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

        if (serverVersion !== localVersion) {
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
              // Force hard reload bypassing cache
              window.location.reload(true);
            }
          });
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra phiên bản:', error);
      } finally {
        setChecked(true);
      }
    };

    if (!checked) {
      checkVersion();
    }
  }, [checked]);

  return null; // This component runs in the background
};

export default VersionChecker;
