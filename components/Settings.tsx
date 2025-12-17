
import React, { useRef, useState } from 'react';
import { Download, Upload, Cloud, Monitor, Smartphone, Moon, Sun, Laptop, Languages, Volume2, Play, Music, Trash2 } from 'lucide-react';
import { Task, Theme, SoundType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingsProps {
  tasks: Task[];
  onImport: (json: string) => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  notificationSound: SoundType;
  customSoundData: string | null;
  onUpdateSound: (type: SoundType, data?: string | null) => void;
  onPreviewSound: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  tasks, 
  onImport, 
  currentTheme, 
  onThemeChange,
  notificationSound,
  customSoundData,
  onUpdateSound,
  onPreviewSound
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const soundFileInputRef = useRef<HTMLInputElement>(null);
  const { t, setLanguage, language } = useLanguage();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify({ tasks, exportedAt: Date.now() }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hyperfocus_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImport(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    // Check size (limit to 2MB for localStorage health)
    if (file.size > 2 * 1024 * 1024) {
        setUploadError(t('max_file_size'));
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onUpdateSound('custom', result);
      }
    };
    reader.readAsDataURL(file);
    if (soundFileInputRef.current) soundFileInputRef.current.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('settings_title')}</h2>
        <p className="text-slate-500 dark:text-slate-400">{t('settings_desc')}</p>
      </div>

      {/* Language Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-8 transition-colors">
        <div className="flex items-center gap-3 mb-4 text-indigo-500 dark:text-indigo-400">
           <Languages size={24} />
           <h3 className="text-lg font-semibold">{t('language')}</h3>
        </div>
        
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-x-auto">
          {(['en', 'fr', 'de', 'es'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                language === lang 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <span className="uppercase">{lang}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Notification Sounds Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-8 transition-colors">
        <div className="flex items-center gap-3 mb-4 text-indigo-500 dark:text-indigo-400">
           <Volume2 size={24} />
           <h3 className="text-lg font-semibold">{t('notifications_sounds')}</h3>
        </div>

        <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                    onClick={() => onUpdateSound('default')}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                        notificationSound === 'default' 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${notificationSound === 'default' ? 'border-indigo-500' : 'border-slate-400'}`}>
                        {notificationSound === 'default' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </div>
                    {t('sound_default')}
                </button>

                <button
                    onClick={() => onUpdateSound('retro')}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                        notificationSound === 'retro' 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${notificationSound === 'retro' ? 'border-indigo-500' : 'border-slate-400'}`}>
                        {notificationSound === 'retro' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </div>
                    {t('sound_retro')}
                </button>

                <button
                    onClick={() => onUpdateSound('soft')}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                        notificationSound === 'soft' 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${notificationSound === 'soft' ? 'border-indigo-500' : 'border-slate-400'}`}>
                        {notificationSound === 'soft' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </div>
                    {t('sound_soft')}
                </button>

                <button
                    onClick={() => onUpdateSound('custom')}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                        notificationSound === 'custom' 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${notificationSound === 'custom' ? 'border-indigo-500' : 'border-slate-400'}`}>
                        {notificationSound === 'custom' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </div>
                    {t('sound_custom')}
                </button>
            </div>

            {/* Custom Sound Upload Area */}
            {notificationSound === 'custom' && (
                <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                    {customSoundData ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                <Music size={16} />
                                <span>Custom Sound Loaded</span>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => soundFileInputRef.current?.click()}
                                    className="text-xs text-indigo-500 hover:underline"
                                >
                                    Change
                                </button>
                                <button 
                                    onClick={() => onUpdateSound('custom', null)}
                                    className="text-slate-400 hover:text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <button 
                                onClick={() => soundFileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center w-full gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors"
                            >
                                <Upload size={24} />
                                <span className="text-sm font-medium">{t('upload_sound')}</span>
                                <span className="text-xs opacity-70">(.mp3, .wav, .ogg - {t('max_file_size')})</span>
                            </button>
                        </div>
                    )}
                    {uploadError && <p className="text-xs text-red-500 mt-2 text-center">{uploadError}</p>}
                </div>
            )}

            <button 
                onClick={onPreviewSound}
                disabled={notificationSound === 'custom' && !customSoundData}
                className="w-full mt-2 py-2 flex items-center justify-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
            >
                <Play size={16} /> {t('preview_sound')}
            </button>
        </div>
        
        <input 
            type="file" 
            ref={soundFileInputRef} 
            onChange={handleSoundUpload} 
            accept="audio/*" 
            className="hidden" 
        />
      </section>

      {/* Appearance Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-8 transition-colors">
        <div className="flex items-center gap-3 mb-4 text-indigo-500 dark:text-indigo-400">
           <Sun size={24} />
           <h3 className="text-lg font-semibold">{t('appearance')}</h3>
        </div>
        
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
          {(['light', 'dark', 'system'] as const).map(theme => (
            <button
              key={theme}
              onClick={() => onThemeChange(theme)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                currentTheme === theme 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {theme === 'light' && <Sun size={16} />}
              {theme === 'dark' && <Moon size={16} />}
              {theme === 'system' && <Laptop size={16} />}
              <span className="capitalize">{theme}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Sync Section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-8 transition-colors">
        <div className="flex items-center gap-3 mb-4 text-indigo-500 dark:text-indigo-400">
           <Cloud size={24} />
           <h3 className="text-lg font-semibold">{t('cross_device_sync')}</h3>
        </div>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          {t('sync_desc')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg flex items-center gap-4 border border-slate-200 dark:border-slate-700/50">
             <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-slate-400 border border-slate-200 dark:border-slate-700"><Monitor size={20}/></div>
             <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('on_pc_mac')}</div>
                <div className="text-xs text-slate-500">{t('export_cloud')}</div>
             </div>
          </div>
          <div className="hidden sm:flex items-center justify-center text-slate-400 dark:text-slate-600">➔</div>
           <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg flex items-center gap-4 border border-slate-200 dark:border-slate-700/50">
             <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-slate-400 border border-slate-200 dark:border-slate-700"><Smartphone size={20}/></div>
             <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('on_mobile')}</div>
                <div className="text-xs text-slate-500">{t('import_cloud')}</div>
             </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">{t('data_actions')}</h3>
        
        <button 
          onClick={handleExport}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl group transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/20 transition-colors">
              <Download size={24} />
            </div>
            <div className="text-left">
              <div className="font-medium text-slate-700 dark:text-slate-200">{t('export_data')}</div>
              <div className="text-xs text-slate-500">{t('export_desc')}</div>
            </div>
          </div>
          <div className="text-slate-400 group-hover:translate-x-1 transition-transform">➔</div>
        </button>

        <button 
          onClick={handleImportClick}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl group transition-all"
        >
          <div className="flex items-center gap-4">
             <div className="p-2 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors">
              <Upload size={24} />
            </div>
            <div className="text-left">
              <div className="font-medium text-slate-700 dark:text-slate-200">{t('import_data')}</div>
              <div className="text-xs text-slate-500">{t('import_desc')}</div>
            </div>
          </div>
          <div className="text-slate-400 group-hover:translate-x-1 transition-transform">➔</div>
        </button>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".json" 
          className="hidden" 
        />
      </section>

      <div className="mt-12 text-center">
         <p className="text-xs text-slate-500 dark:text-slate-600">
           Version 1.2.0 • {t('local_storage_usage')}: {Math.round(JSON.stringify(tasks).length / 1024)} KB
         </p>
      </div>
    </div>
  );
};
