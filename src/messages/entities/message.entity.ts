import {
  Conversation,
  LatestMessage,
} from '../../conversations/entities/conversation.entity';

export class Message extends LatestMessage {
  conversation: Conversation;
}
