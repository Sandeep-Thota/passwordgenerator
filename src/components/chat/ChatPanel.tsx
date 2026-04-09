// ==========================================
// PokerZone - Chat Panel Component
// ==========================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChatMessage } from '../../engine/types';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../../constants/theme';
import { EMOJI_REACTIONS } from '../../constants/theme';
import { formatTimeAgo } from '../../utils/formatters';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onEmojiReaction: (emoji: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ChatPanel({
  messages,
  onSend,
  onEmojiReaction,
  isExpanded,
  onToggle,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSend(inputText.trim());
      setInputText('');
    }
  };

  if (!isExpanded) {
    return (
      <TouchableOpacity style={styles.collapsed} onPress={onToggle}>
        <Text style={styles.collapsedIcon}>💬</Text>
        {messages.length > 0 && (
          <Text style={styles.collapsedText} numberOfLines={1}>
            {messages[messages.length - 1].playerName}: {messages[messages.length - 1].message}
          </Text>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{messages.length}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={onToggle}>
        <Text style={styles.headerTitle}>Chat</Text>
        <Text style={styles.headerCount}>{messages.length} messages</Text>
        <Text style={styles.collapseIcon}>▼</Text>
      </TouchableOpacity>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        renderItem={({ item }) => (
          <View style={[
            styles.message,
            item.type === 'system' && styles.systemMessage,
            item.type === 'emoji-reaction' && styles.emojiMessage,
          ]}>
            {item.type === 'emoji-reaction' ? (
              <View style={styles.emojiReaction}>
                <Text style={styles.emojiReactionName}>{item.playerName}</Text>
                <Text style={styles.emojiReactionEmoji}>{item.message}</Text>
              </View>
            ) : item.type === 'system' ? (
              <Text style={styles.systemText}>{item.message}</Text>
            ) : (
              <>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageName}>{item.playerName}</Text>
                  <Text style={styles.messageTime}>{formatTimeAgo(item.timestamp)}</Text>
                </View>
                <Text style={styles.messageText}>{item.message}</Text>
              </>
            )}
          </View>
        )}
      />

      {/* Emoji quick reactions */}
      {showEmojis && (
        <View style={styles.emojiBar}>
          {EMOJI_REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.emojiButton}
              onPress={() => {
                onEmojiReaction(emoji);
                setShowEmojis(false);
              }}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.emojiToggle}
          onPress={() => setShowEmojis(!showEmojis)}
        >
          <Text style={styles.emojiToggleText}>😀</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textMuted}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : null]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={[styles.sendText, inputText.trim() ? styles.sendTextActive : null]}>
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgMedium,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    maxHeight: 350,
  },
  collapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgMedium,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  collapsedIcon: {
    fontSize: 16,
  },
  collapsedText: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  badge: {
    backgroundColor: Colors.info,
    borderRadius: BorderRadius.round,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
    flex: 1,
  },
  headerCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginRight: Spacing.sm,
  },
  collapseIcon: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  messageList: {
    flex: 1,
    maxHeight: 220,
  },
  messageListContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  message: {
    marginBottom: Spacing.sm,
  },
  systemMessage: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  emojiMessage: {
    alignItems: 'center',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  messageName: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  messageTime: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  messageText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  systemText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontStyle: 'italic',
  },
  emojiReaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emojiReactionName: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  emojiReactionEmoji: {
    fontSize: 24,
  },
  emojiBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgLight,
  },
  emojiButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
  },
  emojiText: {
    fontSize: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  emojiToggle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiToggleText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    height: 36,
    backgroundColor: Colors.bgLight,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
  },
  sendButtonActive: {
    backgroundColor: Colors.info,
  },
  sendText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  sendTextActive: {
    color: '#FFFFFF',
  },
});
