

import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/user.js';

function UserSettings({ user, settings, onSettingsUpdate, onDeleteAccount }) {
  const [localSettings, setLocalSettings] = useState(settings || {
    notificationEmail: true,
    notificationPush: true,
    notificationSms: false,
    privacyLevel: 'PUBLIC',
    displayOnlineStatus: true,
    displayLastActive: true
  });
  const [loading, setLoading] = useState(false);

  // 当外部 settings 更新时，同步本地状态
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setLocalSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userAPI.updateSettings(localSettings);
      onSettingsUpdate(localSettings); // 通知父组件更新
    } catch (error) {
      console.error('保存设置失败:', error);
      // 可以通过 props 传递错误处理函数
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={saveSettings} className="settings-form">
      <div className="form-section">
        <h3>Notification Settings</h3>
        
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="notificationEmail"
              checked={localSettings.notificationEmail}
              onChange={handleSettingsChange}
            />
            <span>Email Notifications</span>
          </label>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="notificationPush"
              checked={localSettings.notificationPush}
              onChange={handleSettingsChange}
            />
            <span>Push Notifications</span>
          </label>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="notificationSms"
              checked={localSettings.notificationSms}
              onChange={handleSettingsChange}
            />
            <span>SMS Notifications</span>
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>Privacy Settings</h3>
        
        <div className="form-group">
          <label htmlFor="privacyLevel">Privacy Level</label>
          <select
            id="privacyLevel"
            name="privacyLevel"
            value={localSettings.privacyLevel}
            onChange={handleSettingsChange}
          >
            <option value="PUBLIC">Public</option>
            <option value="FRIENDS">Friends Only</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="displayOnlineStatus"
              checked={localSettings.displayOnlineStatus}
              onChange={handleSettingsChange}
            />
            <span>Show Online Status</span>
          </label>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="displayLastActive"
              checked={localSettings.displayLastActive}
              onChange={handleSettingsChange}
            />
            <span>Show Last Active Time</span>
          </label>
        </div>
      </div>

      <button type="submit" className="save-button" disabled={loading}>
        {loading ? 'Saving...' : 'Save Settings'}
      </button>

      <div className="danger-zone">
        <h3>Danger Zone</h3>
        <button 
          type="button" 
          className="delete-button" 
          onClick={onDeleteAccount}
        >
          Delete Account
        </button>
      </div>
    </form>
  );
}

export default UserSettings;
