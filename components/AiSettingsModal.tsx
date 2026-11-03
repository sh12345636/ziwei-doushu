'use client';
/**
 * AiSettingsModal —— 用户自己填 AI 配置（纯静态 APP 模式）
 *
 * 密钥只存在这台设备的 localStorage 里，不上传任何服务器。
 *
 * ⚠️ 关于输入可靠性（2026-11-03 修）：
 * 在 Android WebView 里，受控组件的 onChange 在「密码框自动填充 / 粘贴 / 输入法组合」
 * 等场景下可能不触发，导致界面上明明填了，state 里却是空的 —— 表现出来就是
 * 「填了密钥还提示要填写」。故这里做了三重保险：
 *   1. onChange + onInput 双重绑定（onInput 更底层）
 *   2. 保存时用 ref 直接读 DOM 真实值，不依赖 state
 *   3. 每栏实时显示字符数，让用户能直接看出输入有没有进去
 * 另外密钥框默认不再用 type=password（部分 WebView 的密码框行为异常）。
 */
import { useEffect, useRef, useState } from 'react';
import {
  AI_PRESETS,
  DEFAULT_AI_CONFIG,
  clearAiConfig,
  loadAiConfig,
  saveAiConfig,
  type UserAiConfig,
} from '@/lib/ai/client';
import { APP_VERSION_LABEL } from '@/lib/version';

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
  const [hideKey, setHideKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const baseRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const cfg = loadAiConfig();
    if (cfg) {
      setBaseURL(cfg.baseURL);
      setApiKey(cfg.apiKey);
      setModel(cfg.model);
    }
    setSaved(false);
    setError('');
  }, [open]);

  // 打开后把 DOM 里的值也同步一遍（受控组件的 defaultValue 与 state 可能不同步）
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const cfg = loadAiConfig();
      if (cfg) {
        if (baseRef.current) baseRef.current.value = cfg.baseURL;
        if (keyRef.current) keyRef.current.value = cfg.apiKey;
        if (modelRef.current) modelRef.current.value = cfg.model;
      }
    }, 50);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open) return null;

  /** 读输入框真实值：优先 DOM，退路才是 state */
  const readValue = (ref: React.RefObject<HTMLInputElement | null>, fallback: string): string => {
    const domVal = ref.current?.value;
    if (typeof domVal === 'string' && domVal.length > 0) return domVal.trim();
    return fallback.trim();
  };

  const applyPreset = (p: { baseURL: string; model: string }) => {
    setBaseURL(p.baseURL);
    setModel(p.model);
    if (baseRef.current) baseRef.current.value = p.baseURL;
    if (modelRef.current) modelRef.current.value = p.model;
    setError('');
  };

  const handleSave = () => {
    // 以 DOM 真实值为准
    const cfg: UserAiConfig = {
      baseURL: readValue(baseRef, baseURL),
      apiKey: readValue(keyRef, apiKey),
      model: readValue(modelRef, model),
    };

    const missing: string[] = [];
    if (!cfg.baseURL) missing.push('接口地址');
    if (!cfg.apiKey) missing.push('API 密钥');
    if (!cfg.model) missing.push('模型名称');
    if (missing.length) {
      const detail = `接口地址 ${cfg.baseURL.length} 字 / 密钥 ${cfg.apiKey.length} 字 / 模型 ${cfg.model.length} 字`;
      setError(`请先填写：${missing.join('、')}（当前读到：${detail}）`);
      setSaved(false);
      return;
    }

    const result = saveAiConfig(cfg);
    if (!result.ok) {
      setError(`保存失败：${result.error ?? '未知原因'}`);
      setSaved(false);
      return;
    }

    setError('');
    setSaved(true);
    onSaved?.();
    setTimeout(() => onClose(), 1200);
  };

  /** 切换显隐：先把 DOM 里的真实值同步进 state，再重渲染，
   *  否则受控组件可能用空 state 覆盖掉刚输入的密钥 */
  const toggleHide = () => {
    const domVal = keyRef.current?.value;
    if (typeof domVal === 'string') setApiKey(domVal);
    setHideKey((v) => !v);
  };

  const handleClear = () => {
    clearAiConfig();
    setApiKey('');
    if (keyRef.current) keyRef.current.value = '';
    setSaved(false);
    setError('');
    onSaved?.();
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--t-card)',
    border: '1px solid var(--t-border)',
    color: 'var(--t-text)',
  };

  const counter = (n: number, empty: string) => (
    <span
      className="text-[9px] ml-1"
      style={{ color: n > 0 ? '#10b981' : 'var(--t-faint)' }}
    >
      {n > 0 ? `${n} 字符` : empty}
    </span>
  );

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
            {counter(baseURL.length, '未填')}
          </label>
          <input
            ref={baseRef}
            value={baseURL}
            onChange={(e) => setBaseURL(e.target.value)}
            onInput={(e) => setBaseURL((e.target as HTMLInputElement).value)}
            placeholder="https://api.deepseek.com/v1"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full mt-1 rounded-lg px-3 py-2 text-xs focus:outline-none"
            style={inputStyle}
          />
        </div>

        {/* 密钥 */}
        <div className="mb-3">
          <label className="text-[10px] tracking-wider" style={{ color: 'var(--t-faint)' }}>
            API 密钥
            {counter(apiKey.length, '未填')}
          </label>
          <div className="relative mt-1">
            <input
              ref={keyRef}
              type={hideKey ? 'password' : 'text'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
              placeholder="sk-..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full rounded-lg px-3 py-2 pr-14 text-xs focus:outline-none"
              style={inputStyle}
            />
            <button
              onClick={toggleHide}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded"
              style={{ color: 'var(--t-faint)' }}
            >
              {hideKey ? '显示' : '隐藏'}
            </button>
          </div>
        </div>

        {/* 模型 */}
        <div className="mb-4">
          <label className="text-[10px] tracking-wider" style={{ color: 'var(--t-faint)' }}>
            模型名称
            {counter(model.length, '未填')}
          </label>
          <input
            ref={modelRef}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            onInput={(e) => setModel((e.target as HTMLInputElement).value)}
            placeholder="deepseek-chat"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full mt-1 rounded-lg px-3 py-2 text-xs focus:outline-none"
            style={inputStyle}
          />
        </div>

        {/* 提示 */}
        <p className="text-[10px] leading-relaxed mb-4" style={{ color: 'var(--t-faint)' }}>
          密钥存在这台设备的浏览器里。换设备或清理浏览器数据后需要重新填写。
          排盘、看盘、古籍不需要密钥。
        </p>

        {/* 版本号 */}
        <div
          className="text-[9px] text-center mb-3"
          style={{ color: 'var(--t-faint)', opacity: 0.55, letterSpacing: '0.1em' }}
        >
          紫微命盘 {APP_VERSION_LABEL}
        </div>

        {/* 错误 / 成功提示 */}
        {error && (
          <div
            className="text-[11px] rounded-lg px-3 py-2 mb-3 leading-relaxed"
            style={{
              color: '#ff8a8a',
              background: 'rgba(255,80,80,0.08)',
              border: '1px solid rgba(255,80,80,0.25)',
            }}
          >
            ⚠ {error}
          </div>
        )}
        {saved && !error && (
          <div
            className="text-[11px] rounded-lg px-3 py-2 mb-3"
            style={{
              color: '#10b981',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            ✓ 已保存到本机，可以开始用 AI 解读了
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg py-2 text-xs font-medium transition-all"
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
