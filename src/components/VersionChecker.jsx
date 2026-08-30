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
          const updatingTo = localStorage.getItem('updating_to_version');
          const updatingTime = localStorage.getItem('updating_time');
          
          if (updatingTo === serverVersion && updatingTime) {
            const timePassed = Date.now() - parseInt(updatingTime);
            // Tránh spam cập nhật liên tục trong 3 phút (chờ Vercel build xong)
            if (timePassed < 3 * 60 * 1000) {
              return;
            } else {
              localStorage.removeItem('updating_to_version');
              localStorage.removeItem('updating_time');
            }
          }

          hasAlerted = true;
          Swal.fire({
            title: 'Phát hiện bản cập nhật mới!',
            html: `Phiên bản <b>v${serverVersion}</b> đã có sẵn (Bạn đang dùng v${localVersion}).<br/><br/>Đây là bản cập nhật <b>bảo mật quan trọng</b>. Vui lòng cập nhật ngay để bảo vệ dữ liệu!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Cập nhật ngay',
            cancelButtonText: 'Để sau',
            allowOutsideClick: false,
            customClass: { popup: 'glass-panel' }
          }).then((result) => {
            if (result.isConfirmed) {
              localStorage.setItem('updating_to_version', serverVersion);
              localStorage.setItem('updating_time', Date.now().toString());
              
              Swal.fire({
                title: 'Đang tải bản cập nhật...',
                html: 'Quá trình này mất khoảng <b>1-2 phút</b> để cài đặt code mới.<br/>Vui lòng giữ nguyên màn hình!',
                allowOutsideClick: false,
                background: '#18181b', color: '#fff',
                customClass: { popup: 'glass-panel' },
                didOpen: () => {
                  Swal.showLoading();
                  // Chờ 15s rồi reload. Nếu Vercel chưa build xong, logic 3 phút sẽ chặn popup hiện lại
                  setTimeout(() => {
                    window.location.reload(true);
                  }, 15000);
                }
              });
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
