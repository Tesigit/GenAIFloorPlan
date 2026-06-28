import React from 'react';
import { Clock, X, ChevronRight } from 'lucide-react';

interface HistoryItem {
  id: string;
  timestamp: string;
  summary: string;
  thumbnail: string;
}

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  isOpen,
  onClose,
  history,
  onSelectItem
}) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full bg-gradient-to-b from-white to-purple-50/30 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } w-80 border-l border-purple-100`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Generation History</h3>
              <p className="text-xs text-gray-500">Your recent floor plans</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="p-6 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-purple-100 rounded-full w-fit mx-auto mb-4">
                <Clock className="w-12 h-12 text-purple-400" />
              </div>
              <p className="text-gray-600 font-semibold">No history yet</p>
              <p className="text-sm text-gray-500 mt-1">Generated floor plans will appear here</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="bg-gradient-to-r from-white to-purple-50/50 rounded-xl p-4 cursor-pointer hover:from-purple-50 hover:to-blue-50 transition-all duration-300 border border-purple-100 hover:border-purple-200 hover:shadow-lg transform hover:scale-105"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.thumbnail}
                    alt="Floor plan thumbnail"
                    className="w-14 h-14 rounded-lg object-cover bg-gray-200 border border-gray-300"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {item.summary}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{item.timestamp}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default ChatHistory;
export type { HistoryItem };