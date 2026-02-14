import React, { useState } from "react";
import { X, Search } from "lucide-react";
import { formatNumber } from "../utils/wallet";

const TokenSelectorModal = ({
  tokens,
  selectedToken,
  onSelect,
  onClose,
  title = "Select a token",
  balances = {},
}) => {
  const [search, setSearch] = useState("");

  // Filter tokens based on search
  const filteredTokens = tokens.filter((token) => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      token.name?.toLowerCase().includes(searchLower) ||
      token.symbol?.toLowerCase().includes(searchLower) ||
      token.address?.toLowerCase().includes(searchLower)
    );
  });

  // Get token icon
  const getTokenIcon = (token) => {
    if (token.logoURI) {
      return <span className="text-2xl">{token.logoURI}</span>;
    }
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-yellow-400 flex items-center justify-center">
        <span className="text-white font-bold">
          {token.symbol?.charAt(0) || "T"}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search name or paste address"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Token List */}
        <div className="overflow-y-auto max-h-[400px]">
          {filteredTokens.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No tokens found
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTokens.map((token) => {
                const balance = balances[token.address] || "0";
                const isSelected = selectedToken?.address === token.address;

                return (
                  <button
                    key={token.address}
                    onClick={() => {
                      onSelect(token);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                    disabled={isSelected}
                  >
                    {/* Token Icon */}
                    <div className="flex-shrink-0">
                      {getTokenIcon(token)}
                    </div>

                    {/* Token Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {token.symbol}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {token.name}
                      </div>
                      {token.address && (
                        <div className="text-xs text-gray-400 font-mono truncate">
                          {token.address.substring(0, 6)}...
                          {token.address.substring(token.address.length - 4)}
                        </div>
                      )}
                    </div>

                    {/* Balance */}
                    <div className="text-right flex-shrink-0">
                      <div className="font-medium text-gray-900">
                        {formatNumber(balance, 4)}
                      </div>
                      <div className="text-xs text-gray-500">Balance</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredTokens.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-sm text-gray-500 text-center">
              {filteredTokens.length} token{filteredTokens.length !== 1 ? "s" : ""} found
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default TokenSelectorModal;