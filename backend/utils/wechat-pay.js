/**
 * 微信支付集成模块
 *
 * 依赖环境变量：
 *   WX_APPID       — 小程序 AppID
 *   WX_SECRET      — 小程序 Secret（用于获取 access_token）
 *   WX_MCH_ID      — 微信支付商户号
 *   WX_MCH_KEY     — 商户 API 密钥（V3）
 *   WX_NOTIFY_URL  — 支付回调通知地址（公网可访问）
 *
 * 未配置时所有支付接口返回未开通提示，不影响系统其他功能。
 */

const crypto = require('crypto');
const { generateId, now } = require('../utils');

const CONFIG = {
  appid: process.env.WX_APPID || '',
  mchId: process.env.WX_MCH_ID || '',
  mchKey: process.env.WX_MCH_KEY || '',
  notifyUrl: process.env.WX_NOTIFY_URL || '',
};

/**
 * 检查微信支付是否已配置
 */
function isWechatPayEnabled() {
  return !!(CONFIG.appid && CONFIG.mchId && CONFIG.mchKey);
}

/**
 * 生成微信支付 V3 统一下单请求
 * @param {object} params - { orderNo, amount (分), description, openid }
 * @returns {Promise<{success: boolean, prepayId?: string, paySign?: object, error?: string}>}
 *
 * ⚠️ 尚未真实接入：V3 统一下单需 wechatpay-node-v3 SDK + 商户 API 证书私钥签名，
 * 本函数未实现前必须显式返回失败。历史版本会返回占位 prepay_id/空 paySign 的
 * success:true，前端调起支付必然失败且流水被记为 pending——对家长是「点了付款钱却没到账」，
 * 对机构是脏流水。真实接入后：POST /v3/pay/transactions/jsapi 取 prepay_id，
 * 用商户私钥 SHA256withRSA 签名生成 paySign 再返回 success:true。
 */
async function createPrepayOrder(params) {
  if (!isWechatPayEnabled()) {
    return { success: false, error: '微信支付未配置，请联系管理员设置 WX_MCH_ID 和 WX_MCH_KEY' };
  }

  const { orderNo, amount, openid } = params || {};
  if (!orderNo || !amount || !openid) {
    return { success: false, error: '缺少必要参数' };
  }

  console.error('[WechatPay] 统一下单未真实接入（缺少 wechatpay-node-v3 SDK 与商户证书），拒绝创建支付');
  return {
    success: false,
    error: '微信支付尚未完成对接，暂不可在线支付，请联系机构',
  };
}

/**
 * 验证微信支付回调通知（V3）
 * @param {object} headers - 请求头
 * @param {string} body - 原始请求体
 * @returns {{ verified: boolean, data?: object }}
 */
function verifyNotify(headers, body) {
  // fail-closed：未配置微信支付商户凭证时，绝不视为验签通过（避免伪造回调直接标记订单已支付）
  if (!isWechatPayEnabled()) {
    console.warn('[WechatPay] 未配置微信支付商户凭证，回调验签失败（fail-closed）');
    return { verified: false, reason: 'wechatpay_not_configured' };
  }
  // ⚠️ 安全红线：V3 回调必须使用微信平台证书公钥做 RSA 验签（需安装 wechatpay-node-v3 等 SDK
  // 并配置商户证书）。在接入真实验签之前，本函数必须保持 fail-closed —— 绝不返回 verified:true，
  // 否则攻击者可直接伪造支付成功回调、免费开通课程/会员。
  // TODO: 接入 SDK 后，在此用平台证书验签 body，并校验 headers['wechatpay-signature'] /
  // 'wechatpay-timestamp' / 'wechatpay-nonce' 与本地解密后的明文一致，验证通过才返回 verified:true。
  console.error('[WechatPay] 微信支付已配置但未接入真实的平台证书验签，回调拒绝处理（fail-closed）。'
    + '请先完成 SDK 集成并通过 wechatpay-node-v3 验签后再启用回调。');
  return { verified: false, reason: 'signature_verification_not_implemented' };
}

module.exports = {
  isWechatPayEnabled,
  createPrepayOrder,
  verifyNotify,
  CONFIG,
};
