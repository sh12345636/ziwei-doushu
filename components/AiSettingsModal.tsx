'use client';
/**
 * AiSettingsModal —— 用户自己填 AI 配置（纯静态 APP 模式）
 *
 * 密钥只存在这台设备的 localStorage 里，不上传任何服务器。
 * 用户也可以随时清空。
 */
import { useEffect, useState } from 'react';
import {
  AI_PRESETS,
  DEFAULT_AI_CONFIG,
  clearAiConfig,
  loadAiConfig,
  saveAiConfig,
  type UserAiConfig,
} from '@/lib/ai/client';

interface Props {
  open: boolean;
  onClose: () => void;
  /** 保存成功后回调，父组件可据此刷新状态 */
  onSaved?: () => void;
}

export default function AiSettingsModal({ open, onClose, onSaved }: Props) {
  const [baseURL, setBaseURL] = useState(DEFAULT_AI_CONFIG.baseURL);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_AI_CONFIG.model);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const cfg = loadAiConfig();
    if (cfg) {
      setBaseURL(cfg.baseURL);
      setApiKey(cfg.apiKey);
      setModel(cfg.model);
    }
    setSaved(false);
  }, [open]);

  if (!open) return null;

  const applyPreset = (p: { baseURL: string; model: string }) => {
    setBaseURL(p.baseURL);
    setModel(p.model);
  };

  const handleSave = () => {
    const cfg: UserAiConfig = {
      baseURL: baseURL.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
    };
    if (!cfg.baseURL || !cfg.apiKey || !cfg.model) return;
    saveAiConfig(cfg);
    setSaved(true);
    onSaved?.();
    setTimeout(() => onClose(), 600);
  };

  const handleClear = () => {
    clearAiConfig();
    setApiKey('');
    setSaved(false);
    onSaved?.();
  };

  const inputStyle = {
    background: 'var(--t-card)',
    border: '1px solid var(--t-border)',
    color: 'var(--t-text)',
  } as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--t-bg)', border: '1px solid var(--t-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium" style={{ color: 'var(--t-gold)' }}>
              模型设置
            </h3>
            <p className="text-[10px] mt-1" style={{ color: 'var(--t-faint)' }}>
              密钥仅保存在本机，不会上传
            </p>
          </div>
          <button onClick={onClose} className="text-lg leading-none px-1" style={{ color: 'var(--t-faint)' }}>
            ✕
          </button>
        </div>

        {/* 预设 */}
        <div className="mb-4">
          <label className="text-[10px] tracking-wider" style={{ color: 'var(--t-faint)' }}>
            快速选择
          </label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {AI_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPreset(p)}
                className="text-[10px] px-2 py-1 rounded-md transition-all"
                style={{
                  color: baseURL === p.baseURL && model === p.model ? 'var(--t-gold)' : 'var(--t-text2)',
                  border: `1px solid ${baseURL === p.baseURL && model === p.model ? 'rgba(212,168,67,0.5)' : 'var(--t-border)'}`,
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* 接口地址 */}
        <div className="mb-3">
          <label className="text-[10px] tracking-wider" style={{ color: 'var(--t-faint)' }}>
            接口地址（Base URL）
          </label>
          <input
            value={baseURL}
            onChange={(e) => setBaseURL(e.target.value)}
            placeholder="https://api.deepseek.com/v1"
            className="w-full mt-1 rounded-lg px-3 py-2 text-xs focus:outline-none"
            style={inputStyle}
          />
        </div>

        {/* 密钥 */}
        <div className="mb-3">
          <label className="text-[10px] tracking-wider" style={{ color: 'var(--t-faint)' }}>
            API 密钥
          </label>
          <div className="relative mt-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              autoComplete="off"
              className="w-full rounded-lg px-3 py-2 pr-14 text-xs focus:outline-none"
              style={inputStyle}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded"
              style={{ color: 'var(--t-faint)' }}
            >
              {showKey ? '隐藏' : '显示'}
            </button>
          </div>
        </div>

        {/* 模型 */}
        <div className="mb-4">
          <label className="text-[10px] tracking-wider" style={{ color: 'var(--t-faint)' }}>
            模型名称
          </label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="deepseek-chat"
            className="w-full mt-1 rounded-lg px-3 py-2 text-xs focus:outline-none"
            style={inputStyle}
          />
        </div>

        {/* 提示 */}
        <p className="text-[10px] leading-relaxed mb-4" style={{ color: 'var(--t-faint)' }}>
          密钥存在这台设备的浏览器里。换设备或清理浏览器数据后需要重新填写。
          排盘、看盘、古籍不需要密钥。
        </p>

        {/* 按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!baseURL.trim() || !apiKey.trim() || !model.trim()}
            className="flex-1 rounded-lg py-2 text-xs font-medium transition-all disabled:opacity-30"
            style={{
              background: 'rgba(212,168,67,0.15)',
              border: '1px solid rgba(212,168,67,0.3)',
              color: 'var(--t-gold)',
            }}
          >
            {saved ? '已保存 ✓' : '保存'}
          </button>
          <button
            onClick={handleClear}
            className="rounded-lg px-4 py-2 text-xs transition-all"
            style={{ border: '1px solid var(--t-border)', color: 'var(--t-faint)' }}
          >
            清空
          </button>
        </div>
      </div>
    </div>
  );
}
