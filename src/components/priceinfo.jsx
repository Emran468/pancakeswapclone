import React from "react";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { formatNumber } from "../utils/wallet";

const PriceInfo = ({
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  exchangeRate,
  priceImpact,
  slippage,
  loading,
}) => {
  if (!fromAmount || !toAmount || loading) {
    return null;
  }

  const minimumReceived = parseFloat(toAmount) * (1 - slippage / 100);
  const isPriceImpactHigh = priceImpact > 3;
  const isPriceImpactModerate = priceImpact > 1;

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Exchange Rate</span>
        <div className="text-right">
          <div className="text-sm font-medium">
            1 {fromToken.symbol} = {formatNumber(exchangeRate, 6)}{" "}
            {toToken.symbol}
          </div>
          <div className="text-xs text-gray-500">
            1 {toToken.symbol} = {formatNumber(1 / exchangeRate, 6)}{" "}
            {fromToken.symbol}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Price Impact</span>
        <div className="flex items-center gap-1">
          {isPriceImpactHigh ? (
            <TrendingDown className="w-4 h-4 text-red-500" />
          ) : isPriceImpactModerate ? (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          ) : (
            <TrendingUp className="w-4 h-4 text-green-500" />
          )}
          <span
            className={`text-sm font-medium ${
              isPriceImpactHigh
                ? "text-red-600"
                : isPriceImpactModerate
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {formatNumber(priceImpact, 2)}%
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Slippage Tolerance</span>
        <span className="text-sm font-medium">{slippage}%</span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Minimum Received</span>
        <span className="text-sm font-medium">
          {formatNumber(minimumReceived, 6)} {toToken.symbol}
        </span>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-blue-200">
        <span className="text-sm text-gray-600">Route</span>
        <span className="text-sm font-medium">
          {fromToken.symbol} → {toToken.symbol}
        </span>
      </div>

      {isPriceImpactHigh && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">High Price Impact Warning</span>
          </div>
          <div className="text-red-600 mt-1">
            It will significantly impact the token price. Consider
            reducing the amount.
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceInfo;
