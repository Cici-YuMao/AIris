import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { userAPI } from '../../services/user.js';
import UserSettings from './UserSettings.jsx';
import './Profile.css';

function Profile() {
  const { user, updateUser, logout } = useAuth();
  console.log('Profile user:', user);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [settings, setSettings] = useState(null);
  const [preferences, setPreferences] = useState(null);
  
  const [profileData, setProfileData] = useState({
    name: '',
    gender: '',
    age: '',
    sexualOrientation: '',
    height: '',
    weight: '',
    city: '',
    education: '',
    occupation: '',
    hobbies: '',
    pets: '',
    familyStatus: '',
    phone: ''
  });
useEffect(() => {
  if (user) {
    // 获取详细资料
    userAPI.getMe().then(profile => {
      setProfileData({
        name: profile.name || '',
        gender: profile.gender || '',
        age: profile.age || '',
        sexualOrientation: profile.sexualOrientation || '',
        height: profile.height || '',
        weight: profile.weight || '',
        city: profile.city || '',
        education: profile.education || '',
        occupation: profile.occupation || '',
        hobbies: profile.hobbies || '',
        pets: profile.pets || '',
        familyStatus: profile.familyStatus || '',
        phone: profile.phone || ''
      });
    });
    userAPI.getSettings().then(setSettings);
    userAPI.getPreference().then(setPreferences);
  }
}, [user]);


  // 不再需要 loadSettings 和 loadPreferences

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePreferencesChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setPreferences(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleRangeChange = (rangeType, field, value) => {
    setPreferences(prev => ({
      ...prev,
      [rangeType]: {
        ...prev[rangeType],
        [field]: parseInt(value)
      }
    }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updateData = {
        ...profileData,
        age: profileData.age ? parseInt(profileData.age) : undefined,
        height: profileData.height ? parseInt(profileData.height) : undefined,
        weight: profileData.weight ? parseInt(profileData.weight) : undefined
      };

      const result = await updateUser(updateData);
      if (result.success) {
        setMessage({ type: 'success', text: '个人资料更新成功' });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await userAPI.updateSettings(settings);
      setMessage({ type: 'success', text: '设置更新成功' });
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await userAPI.updatePreference(preferences);
      setMessage({ type: 'success', text: '偏好更新成功' });
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '确定要删除账号吗？此操作不可撤销！'
    );
    
    if (confirmed) {
      try {
        await userAPI.deleteAccount();
        logout();
      } catch (error) {
        setMessage({ type: 'error', text: '删除账号失败: ' + error.message });
      }
    }
  };

  const renderProfile = () => (
    <form onSubmit={saveProfile} className="profile-form">

      <div className="form-section">
        <h3>Basic Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              placeholder="Your name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={profileData.phone}
              onChange={handleProfileChange}
              placeholder="Phone number"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={profileData.gender}
              onChange={handleProfileChange}
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="age">Age</label>
            <input
              type="number"
              id="age"
              name="age"
              value={profileData.age}
              onChange={handleProfileChange}
              placeholder="Age"
              min="18"
              max="100"
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="sexualOrientation">Sexual Orientation</label>
          <select
            id="sexualOrientation"
            name="sexualOrientation"
            value={profileData.sexualOrientation}
            onChange={handleProfileChange}
          >
            <option value="">Select</option>
            <option value="HETEROSEXUAL">Heterosexual</option>
            <option value="HOMOSEXUAL">Homosexual</option>
            <option value="BISEXUAL">Bisexual</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="form-section">
        <h3>Appearance</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="height">Height (cm)</label>
            <input
              type="number"
              id="height"
              name="height"
              value={profileData.height}
              onChange={handleProfileChange}
              placeholder="Height"
              min="100"
              max="250"
            />
          </div>
          <div className="form-group">
            <label htmlFor="weight">Weight (kg)</label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={profileData.weight}
              onChange={handleProfileChange}
              placeholder="Weight"
              min="20"
              max="200"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Life Information</h3>
        <div className="form-group">
          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            name="city"
            value={profileData.city}
            onChange={handleProfileChange}
            placeholder="Your city"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="education">Education</label>
            <select
              id="education"
              name="education"
              value={profileData.education}
              onChange={handleProfileChange}
            >
              <option value="">Select</option>
              <option value="HIGH_SCHOOL">High School</option>
              <option value="COLLEGE">College</option>
              <option value="BACHELOR">Bachelor</option>
              <option value="MASTER">Master</option>
              <option value="DOCTOR">Doctorate</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="occupation">Occupation</label>
            <input
              type="text"
              id="occupation"
              name="occupation"
              value={profileData.occupation}
              onChange={handleProfileChange}
              placeholder="Your occupation"
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="hobbies">Hobbies</label>
          <textarea
            id="hobbies"
            name="hobbies"
            value={profileData.hobbies}
            onChange={handleProfileChange}
            placeholder="Describe your hobbies"
            rows={3}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pets">Pets</label>
            <input
              type="text"
              id="pets"
              name="pets"
              value={profileData.pets}
              onChange={handleProfileChange}
              placeholder="Your pets"
            />
          </div>
          <div className="form-group">
            <label htmlFor="familyStatus">Family Status</label>
            <select
              id="familyStatus"
              name="familyStatus"
              value={profileData.familyStatus}
              onChange={handleProfileChange}
            >
              <option value="">Select</option>
              <option value="ONLY_CHILD">Only Child</option>
              <option value="SINGLE_PARENT">Single Parent</option>
              <option value="MULTI_CHILDREN">Multiple Children</option>
              <option value="HIDDEN">Hidden</option>
            </select>
          </div>
        </div>
      </div>

      <button type="submit" className="save-button" disabled={loading}>
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );

  // 用 UserSettings 组件替换原有设置内容，传递 user/settings/onSettingsUpdate/onDeleteAccount
  const renderSettings = () => (
    <UserSettings
      user={user}
      settings={settings}
      onSettingsUpdate={(newSettings) => {
        setSettings(newSettings);
        setMessage({ type: 'success', text: '设置更新成功' });
      }}
      onDeleteAccount={handleDeleteAccount}
    />
  );

  const renderPreferences = () => (
    preferences && (
      <form onSubmit={savePreferences} className="preferences-form">
        <div className="form-section">
        <h3>Match Preferences</h3>
        <div className="preference-section">
          <h4>Age Preference</h4>
          <div className="range-group">
            <label>
              Min Age: {preferences.ageRange?.min || 18}
              <input
                type="range"
                min="18"
                max="80"
                value={preferences.ageRange?.min || 18}
                onChange={(e) => handleRangeChange('ageRange', 'min', e.target.value)}
              />
            </label>
            <label>
              Max Age: {preferences.ageRange?.max || 35}
              <input
                type="range"
                min="18"
                max="80"
                value={preferences.ageRange?.max || 35}
                onChange={(e) => handleRangeChange('ageRange', 'max', e.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="preference-section">
          <h4>Height Preference (cm)</h4>
          <div className="range-group">
            <label>
              Min Height: {preferences.heightRange?.min || 150}
              <input
                type="range"
                min="140"
                max="220"
                value={preferences.heightRange?.min || 150}
                onChange={(e) => handleRangeChange('heightRange', 'min', e.target.value)}
              />
            </label>
            <label>
              Max Height: {preferences.heightRange?.max || 190}
              <input
                type="range"
                min="140"
                max="220"
                value={preferences.heightRange?.max || 190}
                onChange={(e) => handleRangeChange('heightRange', 'max', e.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="preference-section">
          <h4>Weight Preference (kg)</h4>
          <div className="range-group">
            <label>
              Min Weight: {preferences.weightRange?.min || 40}
              <input
                type="range"
                min="30"
                max="150"
                value={preferences.weightRange?.min || 40}
                onChange={(e) => handleRangeChange('weightRange', 'min', e.target.value)}
              />
            </label>
            <label>
              Max Weight: {preferences.weightRange?.max || 100}
              <input
                type="range"
                min="30"
                max="150"
                value={preferences.weightRange?.max || 100}
                onChange={(e) => handleRangeChange('weightRange', 'max', e.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="hobbies">Hobbies Preference</label>
          <textarea
            id="hobbies"
            name="hobbies"
            value={preferences.hobbies || ''}
            onChange={handlePreferencesChange}
            placeholder="What hobbies do you want your match to have?"
            rows={3}
          />
        </div>
        <div className="form-group">
          <label htmlFor="preferredCities">Preferred Cities</label>
          <input
            type="text"
            id="preferredCities"
            name="preferredCities"
            value={preferences.preferredCities?.join(', ') || ''}
            onChange={(e) => {
              const cities = e.target.value.split(',').map(city => city.trim()).filter(city => city);
              setPreferences(prev => ({ ...prev, preferredCities: cities }));
            }}
            placeholder="Separate multiple cities with commas"
          />
        </div>
        <div className="form-group">
          <label htmlFor="dealBreakers">Deal Breakers</label>
          <textarea
            id="dealBreakers"
            name="dealBreakers"
            value={preferences.dealBreakers?.join(', ') || ''}
            onChange={(e) => {
              const dealBreakers = e.target.value.split(',').map(item => item.trim()).filter(item => item);
              setPreferences(prev => ({ ...prev, dealBreakers }));
            }}
            placeholder="Separate your deal breakers with commas, e.g. smoking, not sporty, incompatible values"
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>Top Priorities (choose up to 3)</label>
          <div className="priority-checkbox-group">
            {['height', 'weight', 'age', 'city', 'hobby'].map(priority => (
              <label key={priority} className="priority-checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.topPriorities?.includes(priority) || false}
                  disabled={!preferences.topPriorities?.includes(priority) && (preferences.topPriorities?.length || 0) >= 3}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setPreferences(prev => ({
                      ...prev,
                      topPriorities: isChecked 
                        ? [...(prev.topPriorities || []), priority]
                        : (prev.topPriorities || []).filter(p => p !== priority)
                    }));
                  }}
                />
                <span className="priority-text">
                  {priority === 'height' ? 'Height' :
                   priority === 'weight' ? 'Weight' :
                   priority === 'age' ? 'Age' :
                   priority === 'city' ? 'City' :
                   priority === 'hobby' ? 'Hobby' :
                   priority}
                </span>
              </label>
            ))}
          </div>
          <small>Select the most important criteria when looking for a match</small>
        </div>
        </div>
        <button type="submit" className="save-button" disabled={loading}>
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    )
  );

  if (!user) {
    return <div className="profile-page">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header minimal-profile-header animated-gradient-bg">
        <div className="user-info-minimal">
          <div className="user-row">
            <span className="user-name-minimal fade-in-name">{user.name || user.username}</span>
            {/* <button onClick={logout} className="logout-button minimal-logout">Log out</button> */}
          </div>
          <div className="user-email-minimal">{user.email}</div>
          <div className="user-stats-minimal">
            <span title="Likes">👍 {user.likeCount || 0}</span>
            <span title="Comments">💬 {user.commentCount || 0}</span>
            <span title="Popularity">🔥 {user.popularity || 0}</span>
          </div>
        </div>
      </div>
      <hr className="profile-header-divider" />

      <div className="profile-content">
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Account Settings
          </button>
          <button 
            className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' && message.text.includes('成功') ? message.text.replace('成功', 'Success') :
             message.type === 'error' && message.text.includes('失败') ? message.text.replace('失败', 'Failed') :
             message.text}
          </div>
        )}

        <div className="tab-content">
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'preferences' && renderPreferences()}
        </div>

        {/* danger-zone 区域已由 UserSettings 组件内实现，无需重复 */}
      </div>
    </div>
  );
}

export default Profile;
