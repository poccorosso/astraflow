# Textarea 输入性能优化方案

## 问题分析

用户反馈在 textarea 输入时存在卡顿感觉，经过代码分析发现以下性能问题：

1. **不必要的防抖操作**：每次输入都会触发 lodash debounce，但 `debouncedValue` 状态没有被实际使用
2. **频繁的布局计算**：`useLayoutEffect` 在每次 textarea 高度变化时都会重新计算容器高度
3. **复杂的组件结构**：大量的状态和副作用可能导致不必要的重渲染
4. **浏览器自动功能干扰**：拼写检查、自动完成等功能会影响输入性能

## 优化方案

### 1. 移除不必要的防抖逻辑

**优化前：**
```typescript
const [debouncedValue, setDebouncedValue] = useState("");
const debouncedSetValue = useCallback(
  _.debounce((value: string) => {
    setDebouncedValue(value);
  }, 100),
  []
);

const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  setInputValue(value);
  debouncedSetValue(value); // 不必要的防抖
};
```

**优化后：**
```typescript
// 移除了不必要的防抖状态和逻辑
const inputManager = useOptimizedInput({
  initialValue: "",
  maxLength: 10000,
});
```

### 2. 优化高度计算机制

**优化前：**
```typescript
useLayoutEffect(() => {
  if (textareaRef.current) {
    const height = `calc(100vh - 180px - ${
      textareaRef.current.offsetHeight + 32
    }px)`;
    setContainerHeight(height);
  }
}, [textareaRef.current?.offsetHeight]); // 频繁触发
```

**优化后：**
```typescript
// 使用 ResizeObserver 替代 useLayoutEffect
useEffect(() => {
  const textarea = textareaRef.current;
  if (!textarea) return;

  const resizeObserver = new ResizeObserver(() => {
    updateContainerHeight();
  });

  resizeObserver.observe(textarea);
  updateContainerHeight();

  return () => {
    resizeObserver.disconnect();
  };
}, [updateContainerHeight]);
```

### 3. 创建优化的 Textarea 组件

创建了 `OptimizedTextarea` 组件，包含以下优化：

- **禁用浏览器自动功能**：`spellCheck={false}`, `autoComplete="off"` 等
- **防止第三方插件干扰**：添加 `data-gramm="false"` 等属性
- **使用 React.memo 优化渲染**：避免不必要的重渲染
- **支持输入法组合事件**：正确处理中文输入

### 4. 创建优化的输入管理 Hook

`useOptimizedInput` Hook 提供：

- **智能防抖**：可配置的防抖延迟，输入法组合时不防抖
- **输入法支持**：正确处理 `compositionstart` 和 `compositionend` 事件
- **长度限制**：内置最大长度限制功能
- **性能优化**：使用 `useCallback` 缓存函数

### 5. 滚动性能优化

**优化前：**
```typescript
const scrollToBottom = () => {
  setTimeout(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, 100);
};
```

**优化后：**
```typescript
const scrollToBottom = useCallback(() => {
  if (messagesContainerRef.current) {
    messagesContainerRef.current.scrollTop =
      messagesContainerRef.current.scrollHeight;
  }
}, []);

// 使用 requestAnimationFrame 优化滚动
useEffect(() => {
  const scrollWithRAF = () => {
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  };
  
  scrollWithRAF();
}, [messages, isLoading, scrollToBottom]);
```

### 6. 简化的性能监控组件

添加了 `SimplePerformanceMonitor` 组件来实时监控：

- **按键计数**：统计输入的按键次数
- **输入延迟**：测量从按键到界面更新的延迟
- **平均延迟**：计算最近20次输入的平均延迟
- **颜色编码**：绿色（<30ms）、黄色（30-60ms）、红色（>60ms）

**修复说明**：原始的 `PerformanceMonitor` 组件存在无限循环问题，因为在 `useEffect` 中更新状态导致组件不断重渲染。新的 `SimplePerformanceMonitor` 只监控输入延迟，避免了复杂的渲染监控，更加稳定可靠。

## 性能提升效果

### 预期改善：

1. **输入响应性**：移除不必要的防抖和浏览器自动功能，输入更加流畅
2. **渲染性能**：使用 `useCallback` 和 `React.memo` 减少不必要的重渲染
3. **布局计算**：使用 `ResizeObserver` 替代 `useLayoutEffect` 减少布局抖动
4. **滚动性能**：使用 `requestAnimationFrame` 优化滚动动画
5. **中文输入**：正确处理输入法组合事件，改善中文输入体验

### 性能指标：

- **输入延迟**：目标 < 50ms（良好），< 100ms（可接受）
- **渲染时间**：目标 < 16ms（60fps），< 33ms（30fps）
- **内存使用**：减少不必要的状态和定时器

## 使用方法

1. **启用性能监控**：点击右下角的活动图标查看实时性能数据
2. **测试输入性能**：在 textarea 中快速输入，观察延迟指标
3. **监控渲染性能**：观察渲染时间是否保持在绿色范围内

## 注意事项

1. **兼容性**：`ResizeObserver` 在现代浏览器中支持良好
2. **输入法**：优化主要针对中文输入法，其他语言输入法也会受益
3. **性能监控**：生产环境中可以禁用性能监控组件以节省资源

## 故障排除

### 常见问题

1. **"Maximum update depth exceeded" 错误**
   - **原因**：组件在 `useEffect` 中更新状态，但依赖项在每次渲染时都会改变
   - **解决方案**：使用空依赖数组 `[]` 或正确的依赖项，避免在渲染过程中更新状态

2. **输入延迟仍然很高**
   - **检查浏览器扩展**：禁用 Grammarly、拼写检查等扩展
   - **检查 CSS 动画**：复杂的 CSS 动画可能影响输入性能
   - **检查其他 JavaScript**：其他脚本可能阻塞主线程

3. **性能监控器不显示数据**
   - **确保在 textarea 中输入**：监控器只监控实际的文本输入
   - **检查浏览器兼容性**：某些 API 在旧浏览器中可能不支持

### 调试技巧

1. **使用浏览器开发者工具**：
   - Performance 标签页可以分析渲染性能
   - Console 标签页可以查看错误信息

2. **逐步禁用优化**：
   - 如果出现问题，可以逐步禁用优化功能来定位问题

## 后续优化建议

1. **虚拟化**：如果消息列表很长，考虑使用虚拟滚动
2. **Web Workers**：将复杂的文本处理移到 Web Worker 中
3. **缓存优化**：缓存渲染结果和计算结果
4. **懒加载**：延迟加载非关键组件
