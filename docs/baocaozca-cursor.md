# Báo cáo zca-js 2.1.2

## Lưu ý

- **Nguồn dữ liệu:** gói npm `zca-js@2.1.2` (đường dẫn cục bộ: `zalo-guardian/_zca_study/node_modules/zca-js`), tương đương bản nhúng trong `openclaw/.../node_modules/zca-js` trên Linux.
- **Lệnh mẫu** trong nhiệm vụ gốc trỏ tới `/home/duc/.npm-global/.../zca-js/dist` — **không thực thi** trên môi trường build Windows; nội dung thu thập từ cùng phiên bản gói qua `npm install zca-js@2.1.2`.
- **`listen.cjs`:** trong gói đã kiểm tra **không có** file tên `dist/listen.cjs`. Code listener nằm ở **`dist/apis/listen.js`** (ESM). PHẦN C dùng file này thay thế lệnh `grep listen.cjs`.
- **Entry TypeScript gốc:** file `index.d.ts` ở **root package** chỉ là `export * from "./dist";` — toàn bộ types thực nằm dưới `dist/` (xem PHẦN A.1 `dist/index.d.ts`).

---

## PHẦN A — find dist -name '*.d.ts' | sort

```
dist/apis.d.ts
dist/apis/acceptFriendRequest.d.ts
dist/apis/addGroupBlockedMember.d.ts
dist/apis/addGroupDeputy.d.ts
dist/apis/addPollOptions.d.ts
dist/apis/addQuickMessage.d.ts
dist/apis/addReaction.d.ts
dist/apis/addUnreadMark.d.ts
dist/apis/addUserToGroup.d.ts
dist/apis/blockUser.d.ts
dist/apis/blockViewFeed.d.ts
dist/apis/changeAccountAvatar.d.ts
dist/apis/changeFriendAlias.d.ts
dist/apis/changeGroupAvatar.d.ts
dist/apis/changeGroupName.d.ts
dist/apis/changeGroupOwner.d.ts
dist/apis/createAutoReply.d.ts
dist/apis/createCatalog.d.ts
dist/apis/createGroup.d.ts
dist/apis/createNote.d.ts
dist/apis/createPoll.d.ts
dist/apis/createProductCatalog.d.ts
dist/apis/createReminder.d.ts
dist/apis/custom.d.ts
dist/apis/deleteAutoReply.d.ts
dist/apis/deleteAvatar.d.ts
dist/apis/deleteCatalog.d.ts
dist/apis/deleteChat.d.ts
dist/apis/deleteGroupInviteBox.d.ts
dist/apis/deleteMessage.d.ts
dist/apis/deleteProductCatalog.d.ts
dist/apis/disableGroupLink.d.ts
dist/apis/disperseGroup.d.ts
dist/apis/editNote.d.ts
dist/apis/editReminder.d.ts
dist/apis/enableGroupLink.d.ts
dist/apis/fetchAccountInfo.d.ts
dist/apis/findUser.d.ts
dist/apis/findUserByUsername.d.ts
dist/apis/forwardMessage.d.ts
dist/apis/getAliasList.d.ts
dist/apis/getAllFriends.d.ts
dist/apis/getAllGroups.d.ts
dist/apis/getArchivedChatList.d.ts
dist/apis/getAutoDeleteChat.d.ts
dist/apis/getAutoReplyList.d.ts
dist/apis/getAvatarList.d.ts
dist/apis/getAvatarUrlProfile.d.ts
dist/apis/getBizAccount.d.ts
dist/apis/getCatalogList.d.ts
dist/apis/getCloseFriends.d.ts
dist/apis/getContext.d.ts
dist/apis/getCookie.d.ts
dist/apis/getFriendBoardList.d.ts
dist/apis/getFriendOnlines.d.ts
dist/apis/getFriendRecommendations.d.ts
dist/apis/getFriendRequestStatus.d.ts
dist/apis/getFullAvatar.d.ts
dist/apis/getGroupBlockedMember.d.ts
dist/apis/getGroupChatHistory.d.ts
dist/apis/getGroupInfo.d.ts
dist/apis/getGroupInviteBoxInfo.d.ts
dist/apis/getGroupInviteBoxList.d.ts
dist/apis/getGroupLinkDetail.d.ts
dist/apis/getGroupLinkInfo.d.ts
dist/apis/getGroupMembersInfo.d.ts
dist/apis/getHiddenConversations.d.ts
dist/apis/getLabels.d.ts
dist/apis/getListBoard.d.ts
dist/apis/getListReminder.d.ts
dist/apis/getMultiUsersByPhones.d.ts
dist/apis/getMute.d.ts
dist/apis/getOwnId.d.ts
dist/apis/getPendingGroupMembers.d.ts
dist/apis/getPinConversations.d.ts
dist/apis/getPollDetail.d.ts
dist/apis/getProductCatalogList.d.ts
dist/apis/getQR.d.ts
dist/apis/getQuickMessageList.d.ts
dist/apis/getRelatedFriendGroup.d.ts
dist/apis/getReminder.d.ts
dist/apis/getReminderResponses.d.ts
dist/apis/getSentFriendRequest.d.ts
dist/apis/getSettings.d.ts
dist/apis/getStickerCategoryDetail.d.ts
dist/apis/getStickers.d.ts
dist/apis/getStickersDetail.d.ts
dist/apis/getUnreadMark.d.ts
dist/apis/getUserInfo.d.ts
dist/apis/inviteUserToGroups.d.ts
dist/apis/joinGroupInviteBox.d.ts
dist/apis/joinGroupLink.d.ts
dist/apis/keepAlive.d.ts
dist/apis/lastOnline.d.ts
dist/apis/leaveGroup.d.ts
dist/apis/listen.d.ts
dist/apis/lockPoll.d.ts
dist/apis/login.d.ts
dist/apis/loginQR.d.ts
dist/apis/parseLink.d.ts
dist/apis/rejectFriendRequest.d.ts
dist/apis/removeFriend.d.ts
dist/apis/removeFriendAlias.d.ts
dist/apis/removeGroupBlockedMember.d.ts
dist/apis/removeGroupDeputy.d.ts
dist/apis/removeQuickMessage.d.ts
dist/apis/removeReminder.d.ts
dist/apis/removeUnreadMark.d.ts
dist/apis/removeUserFromGroup.d.ts
dist/apis/resetHiddenConversPin.d.ts
dist/apis/reuseAvatar.d.ts
dist/apis/reviewPendingMemberRequest.d.ts
dist/apis/searchSticker.d.ts
dist/apis/sendBankCard.d.ts
dist/apis/sendCard.d.ts
dist/apis/sendDeliveredEvent.d.ts
dist/apis/sendFriendRequest.d.ts
dist/apis/sendLink.d.ts
dist/apis/sendMessage.d.ts
dist/apis/sendReport.d.ts
dist/apis/sendSeenEvent.d.ts
dist/apis/sendSticker.d.ts
dist/apis/sendTypingEvent.d.ts
dist/apis/sendVideo.d.ts
dist/apis/sendVoice.d.ts
dist/apis/setHiddenConversations.d.ts
dist/apis/setMute.d.ts
dist/apis/setPinnedConversations.d.ts
dist/apis/sharePoll.d.ts
dist/apis/unblockUser.d.ts
dist/apis/undo.d.ts
dist/apis/undoFriendRequest.d.ts
dist/apis/updateActiveStatus.d.ts
dist/apis/updateArchivedChatList.d.ts
dist/apis/updateAutoDeleteChat.d.ts
dist/apis/updateAutoReply.d.ts
dist/apis/updateCatalog.d.ts
dist/apis/updateGroupSettings.d.ts
dist/apis/updateHiddenConversPin.d.ts
dist/apis/updateLabels.d.ts
dist/apis/updateLang.d.ts
dist/apis/updateProductCatalog.d.ts
dist/apis/updateProfile.d.ts
dist/apis/updateProfileBio.d.ts
dist/apis/updateQuickMessage.d.ts
dist/apis/updateSettings.d.ts
dist/apis/upgradeGroupToCommunity.d.ts
dist/apis/uploadAttachment.d.ts
dist/apis/uploadProductPhoto.d.ts
dist/apis/votePoll.d.ts
dist/context.d.ts
dist/Errors/index.d.ts
dist/Errors/ZaloApiError.d.ts
dist/Errors/ZaloApiLoginQRAborted.d.ts
dist/Errors/ZaloApiLoginQRDeclined.d.ts
dist/Errors/ZaloApiMissingImageMetadataGetter.d.ts
dist/index.d.ts
dist/models/Attachment.d.ts
dist/models/AutoReply.d.ts
dist/models/Board.d.ts
dist/models/Catalog.d.ts
dist/models/DeliveredMessage.d.ts
dist/models/Enum.d.ts
dist/models/FriendEvent.d.ts
dist/models/Group.d.ts
dist/models/GroupEvent.d.ts
dist/models/index.d.ts
dist/models/Label.d.ts
dist/models/Message.d.ts
dist/models/ProductCatalog.d.ts
dist/models/QuickMessage.d.ts
dist/models/Reaction.d.ts
dist/models/Reminder.d.ts
dist/models/SeenMessage.d.ts
dist/models/Sticker.d.ts
dist/models/Typing.d.ts
dist/models/Undo.d.ts
dist/models/User.d.ts
dist/models/ZBusiness.d.ts
dist/update.d.ts
dist/utils.d.ts
dist/zalo.d.ts
```

### A.1 cat dist/index.d.ts

```typescript
export * from "./Errors/index.js";
export * from "./models/index.js";
export * from "./zalo.js";
export type { ContextSession, ContextBase, AppContextExtended, AppContextBase, Options, ZPWServiceMap, ImageMetadataGetter, ImageMetadataGetterResponse } from "./context.js";
export type { AcceptFriendRequestResponse } from "./apis/acceptFriendRequest.js";
export type { AddGroupBlockedMemberResponse } from "./apis/addGroupBlockedMember.js";
export type { AddGroupDeputyResponse } from "./apis/addGroupDeputy.js";
export type { AddPollOptionsPayload, AddPollOptionsResponse, AddPollOptionsOption } from "./apis/addPollOptions.js";
export type { AddQuickMessagePayload, AddQuickMessageResponse } from "./apis/addQuickMessage.js";
export type { AddReactionDestination, AddReactionResponse, CustomReaction } from "./apis/addReaction.js";
export type { AddUnreadMarkResponse } from "./apis/addUnreadMark.js";
export type { AddUserToGroupResponse } from "./apis/addUserToGroup.js";
export type { BlockUserResponse } from "./apis/blockUser.js";
export type { BlockViewFeedResponse } from "./apis/blockViewFeed.js";
export type { ChangeAccountAvatarResponse } from "./apis/changeAccountAvatar.js";
export type { ChangeFriendAliasResponse } from "./apis/changeFriendAlias.js";
export type { ChangeGroupAvatarResponse } from "./apis/changeGroupAvatar.js";
export type { ChangeGroupNameResponse } from "./apis/changeGroupName.js";
export type { ChangeGroupOwnerResponse } from "./apis/changeGroupOwner.js";
export type { CreateAutoReplyPayload, CreateAutoReplyResponse } from "./apis/createAutoReply.js";
export type { CreateCatalogResponse } from "./apis/createCatalog.js";
export type { CreateGroupOptions, CreateGroupResponse } from "./apis/createGroup.js";
export type { CreateNoteOptions, CreateNoteResponse } from "./apis/createNote.js";
export type { CreatePollOptions, CreatePollResponse } from "./apis/createPoll.js";
export type { CreateProductCatalogPayload, CreateProductCatalogResponse } from "./apis/createProductCatalog.js";
export type { CreateReminderOptions, CreateReminderResponse, CreateReminderUser, CreateReminderGroup } from "./apis/createReminder.js";
export type { DeleteAutoReplyResponse } from "./apis/deleteAutoReply.js";
export type { DeleteAvatarResponse } from "./apis/deleteAvatar.js";
export type { DeleteCatalogResponse } from "./apis/deleteCatalog.js";
export type { DeleteChatLastMessage, DeleteChatResponse } from "./apis/deleteChat.js";
export type { DeleteGroupInviteBoxResponse } from "./apis/deleteGroupInviteBox.js";
export type { DeleteMessageDestination, DeleteMessageResponse } from "./apis/deleteMessage.js";
export type { DeleteProductCatalogPayload, DeleteProductCatalogResponse } from "./apis/deleteProductCatalog.js";
export type { DisableGroupLinkResponse } from "./apis/disableGroupLink.js";
export type { DisperseGroupResponse } from "./apis/disperseGroup.js";
export type { EditNoteOptions, EditNoteResponse } from "./apis/editNote.js";
export type { EditReminderGroup, EditReminderUser, EditReminderOptions, EditReminderResponse } from "./apis/editReminder.js";
export type { EnableGroupLinkResponse } from "./apis/enableGroupLink.js";
export type { FetchAccountInfoResponse } from "./apis/fetchAccountInfo.js";
export type { FindUserResponse } from "./apis/findUser.js";
export type { FindUserByUsernameResponse } from "./apis/findUserByUsername.js";
export type { ForwardMessageSuccess, ForwardMessageFail, ForwardMessagePayload, ForwardMessageResponse } from "./apis/forwardMessage.js";
export type { GetAliasListResponse } from "./apis/getAliasList.js";
export type { GetAllFriendsResponse } from "./apis/getAllFriends.js";
export type { GetAllGroupsResponse } from "./apis/getAllGroups.js";
export type { GetArchivedChatListResponse } from "./apis/getArchivedChatList.js";
export type { GetAutoDeleteChatResponse } from "./apis/getAutoDeleteChat.js";
export type { GetAutoReplyListResponse } from "./apis/getAutoReplyList.js";
export type { GetAvatarListResponse } from "./apis/getAvatarList.js";
export type { GetAvatarUrlProfileResponse } from "./apis/getAvatarUrlProfile.js";
export type { GetBizAccountResponse } from "./apis/getBizAccount.js";
export type { GetCatalogListPayload, GetCatalogListResponse } from "./apis/getCatalogList.js";
export type { GetCloseFriendsResponse } from "./apis/getCloseFriends.js";
export type { GetFriendBoardListResponse } from "./apis/getFriendBoardList.js";
export type { GetFriendOnlinesResponse, GetFriendOnlinesStatus } from "./apis/getFriendOnlines.js";
export type { GetFriendRecommendationsResponse, FriendRecommendationsCollapseMsgListConfig, FriendRecommendationsDataInfo, FriendRecommendationsRecommItem } from "./apis/getFriendRecommendations.js";
export type { GetFriendRequestStatusResponse } from "./apis/getFriendRequestStatus.js";
export type { GetFullAvatarResponse } from "./apis/getFullAvatar.js";
export type { GetGroupBlockedMemberPayload, GetGroupBlockedMemberResponse } from "./apis/getGroupBlockedMember.js";
export type { GetGroupChatHistoryResponse } from "./apis/getGroupChatHistory.js";
export type { GroupInfoPendingApprove, GroupInfoResponse } from "./apis/getGroupInfo.js";
export type { GetGroupInviteBoxInfoPayload, GetGroupInviteBoxInfoResponse } from "./apis/getGroupInviteBoxInfo.js";
export type { GetGroupInviteBoxListPayload, GetGroupInviteBoxListResponse } from "./apis/getGroupInviteBoxList.js";
export type { GetGroupLinkDetailResponse } from "./apis/getGroupLinkDetail.js";
export type { GetGroupLinkInfoPayload, GetGroupLinkInfoResponse } from "./apis/getGroupLinkInfo.js";
export type { GetGroupMembersInfoResponse, GroupMemberProfile } from "./apis/getGroupMembersInfo.js";
export type { GetHiddenConversationsResponse } from "./apis/getHiddenConversations.js";
export type { GetLabelsResponse } from "./apis/getLabels.js";
export type { BoardItem, GetListBoardResponse, ListBoardOptions } from "./apis/getListBoard.js";
export type { GetListReminderResponse, ListReminderOptions, ReminderListGroup, ReminderListUser } from "./apis/getListReminder.js";
export type { GetMultiUsersByPhonesResponse } from "./apis/getMultiUsersByPhones.js";
export type { GetMuteResponse, MuteEntriesInfo } from "./apis/getMute.js";
export type { GetPendingGroupMembersResponse, GetPendingGroupMembersUserInfo } from "./apis/getPendingGroupMembers.js";
export type { GetPinConversationsResponse } from "./apis/getPinConversations.js";
export type { PollDetailResponse } from "./apis/getPollDetail.js";
export type { GetProductCatalogListPayload, GetProductCatalogListResponse } from "./apis/getProductCatalogList.js";
export type { GetQRResponse } from "./apis/getQR.js";
export type { GetQuickMessageListResponse } from "./apis/getQuickMessageList.js";
export type { GetRelatedFriendGroupResponse } from "./apis/getRelatedFriendGroup.js";
export type { GetReminderResponse } from "./apis/getReminder.js";
export type { GetReminderResponsesResponse } from "./apis/getReminderResponses.js";
export type { GetSentFriendRequestResponse, SentFriendRequestInfo } from "./apis/getSentFriendRequest.js";
export type { GetSettingsResponse } from "./apis/getSettings.js";
export type { GetStickerCategoryDetailResponse } from "./apis/getStickerCategoryDetail.js";
export type { StickerDetailResponse } from "./apis/getStickersDetail.js";
export type { GetUnreadMarkResponse, UnreadMark } from "./apis/getUnreadMark.js";
export type { ProfileInfo, UserInfoResponse } from "./apis/getUserInfo.js";
export type { InviteUserToGroupsResponse } from "./apis/inviteUserToGroups.js";
export type { JoinGroupInviteBoxResponse } from "./apis/joinGroupInviteBox.js";
export type { JoinGroupLinkResponse } from "./apis/joinGroupLink.js";
export type { KeepAliveResponse } from "./apis/keepAlive.js";
export type { LastOnlineResponse } from "./apis/lastOnline.js";
export type { LeaveGroupResponse } from "./apis/leaveGroup.js";
export type { LockPollResponse } from "./apis/lockPoll.js";
export type { LoginQRCallback, LoginQRCallbackEvent } from "./apis/loginQR.js";
export type { ParseLinkErrorMaps, ParseLinkResponse } from "./apis/parseLink.js";
export type { RejectFriendRequestResponse } from "./apis/rejectFriendRequest.js";
export type { RemoveFriendResponse } from "./apis/removeFriend.js";
export type { RemoveFriendAliasResponse } from "./apis/removeFriendAlias.js";
export type { RemoveGroupBlockedMemberResponse } from "./apis/removeGroupBlockedMember.js";
export type { RemoveGroupDeputyResponse } from "./apis/removeGroupDeputy.js";
export type { RemoveQuickMessageResponse } from "./apis/removeQuickMessage.js";
export type { RemoveReminderResponse } from "./apis/removeReminder.js";
export type { RemoveUnreadMarkResponse } from "./apis/removeUnreadMark.js";
export type { RemoveUserFromGroupResponse } from "./apis/removeUserFromGroup.js";
export type { ResetHiddenConversPinResponse } from "./apis/resetHiddenConversPin.js";
export type { ReuseAvatarResponse } from "./apis/reuseAvatar.js";
export type { ReviewPendingMemberRequestPayload, ReviewPendingMemberRequestResponse } from "./apis/reviewPendingMemberRequest.js";
export type { SearchStickerResponse } from "./apis/searchSticker.js";
export type { SendBankCardPayload, SendBankCardResponse } from "./apis/sendBankCard.js";
export type { SendCardOptions, SendCardResponse } from "./apis/sendCard.js";
export type { SendDeliveredEventMessageParams, SendDeliveredEventResponse } from "./apis/sendDeliveredEvent.js";
export type { SendFriendRequestResponse } from "./apis/sendFriendRequest.js";
export type { SendLinkOptions, SendLinkResponse } from "./apis/sendLink.js";
export type { Mention, MessageContent, SendMessageQuote, SendMessageResponse, SendMessageResult, Style } from "./apis/sendMessage.js";
export type { SendReportOptions, SendReportResponse } from "./apis/sendReport.js";
export type { SendSeenEventMessageParams, SendSeenEventResponse } from "./apis/sendSeenEvent.js";
export type { SendStickerResponse, SendStickerPayload } from "./apis/sendSticker.js";
export type { SendTypingEventResponse } from "./apis/sendTypingEvent.js";
export type { SendVideoOptions, SendVideoResponse } from "./apis/sendVideo.js";
export type { SendVoiceOptions, SendVoiceResponse } from "./apis/sendVoice.js";
export type { SetHiddenConversationsResponse } from "./apis/setHiddenConversations.js";
export type { SetMuteParams, SetMuteResponse } from "./apis/setMute.js";
export type { SetPinnedConversationsResponse } from "./apis/setPinnedConversations.js";
export type { SharePollResponse } from "./apis/sharePoll.js";
export type { UnBlockUserResponse } from "./apis/unblockUser.js";
export type { UndoPayload, UndoResponse } from "./apis/undo.js";
export type { UndoFriendRequestResponse } from "./apis/undoFriendRequest.js";
export type { UpdateActiveStatusResponse } from "./apis/updateActiveStatus.js";
export type { UpdateArchivedChatListTarget, UpdateArchivedChatListResponse } from "./apis/updateArchivedChatList.js";
export type { UpdateAutoDeleteChatResponse } from "./apis/updateAutoDeleteChat.js";
export type { UpdateAutoReplyPayload, UpdateAutoReplyResponse } from "./apis/updateAutoReply.js";
export type { UpdateCatalogPayload, UpdateCatalogResponse } from "./apis/updateCatalog.js";
export type { UpdateGroupSettingsOptions, UpdateGroupSettingsResponse } from "./apis/updateGroupSettings.js";
export type { UpdateHiddenConversPinResponse } from "./apis/updateHiddenConversPin.js";
export type { UpdateLabelsPayload, UpdateLabelsResponse } from "./apis/updateLabels.js";
export type { UpdateLangResponse } from "./apis/updateLang.js";
export type { UpdateProductCatalogPayload, UpdateProductCatalogResponse } from "./apis/updateProductCatalog.js";
export type { UpdateProfilePayload, UpdateProfileResponse } from "./apis/updateProfile.js";
export type { UpdateProfileBioResponse } from "./apis/updateProfileBio.js";
export type { UpdateQuickMessagePayload, UpdateQuickMessageResponse } from "./apis/updateQuickMessage.js";
export type { UpdateSettingsResponse } from "./apis/updateSettings.js";
export type { UpgradeGroupToCommunityResponse } from "./apis/upgradeGroupToCommunity.js";
export type { FileData, ImageData, UploadAttachmentResponse, UploadAttachmentType, UploadAttachmentImageResponse, UploadAttachmentVideoResponse, UploadAttachmentFileResponse } from "./apis/uploadAttachment.js";
export type { UploadProductPhotoPayload, UploadProductPhotoResponse } from "./apis/uploadProductPhoto.js";
export type { VotePollResponse } from "./apis/votePoll.js";
export type { CustomAPICallback, CustomAPIProps } from "./apis/custom.js";
export { CloseReason } from "./apis/listen.js";
export { LoginQRCallbackEventType } from "./apis/loginQR.js";
export { FriendRecommendationsType } from "./apis/getFriendRecommendations.js";
export { ReviewPendingMemberRequestStatus } from "./apis/reviewPendingMemberRequest.js";
export { TextStyle, Urgency } from "./apis/sendMessage.js";
export { ReportReason } from "./apis/sendReport.js";
export { MuteAction, MuteDuration } from "./apis/setMute.js";
export { ChatTTL } from "./apis/updateAutoDeleteChat.js";
export { UpdateLangAvailableLanguages } from "./apis/updateLang.js";
export { UpdateSettingsType } from "./apis/updateSettings.js";

```

### A.2 cat dist/models/index.d.ts

```typescript
export * from "./Attachment.js";
export * from "./AutoReply.js";
export * from "./Board.js";
export * from "./Catalog.js";
export * from "./DeliveredMessage.js";
export * from "./Enum.js";
export * from "./FriendEvent.js";
export * from "./Group.js";
export * from "./GroupEvent.js";
export * from "./Message.js";
export * from "./ProductCatalog.js";
export * from "./QuickMessage.js";
export * from "./Reaction.js";
export * from "./Reminder.js";
export * from "./SeenMessage.js";
export * from "./Typing.js";
export * from "./Undo.js";
export * from "./User.js";
export * from "./ZBusiness.js";
export * from "./Label.js";
export * from "./Sticker.js";

```

### A.3 find models *.d.ts

#### Attachment.d.ts

```typescript
export type AttachmentSource = string | {
    data: Buffer;
    filename: `${string}.${string}`;
    metadata: {
        totalSize: number;
        width?: number;
        height?: number;
    };
};

```

#### AutoReply.d.ts

```typescript
export type AutoReplyItem = {
    id: number;
    weight: number;
    enable: boolean;
    modifiedTime: number;
    startTime: number;
    endTime: number;
    content: string;
    scope: AutoReplyScope;
    uids: string[] | null;
    ownerId: number;
    recurrence: string[];
    createdTime: number;
};
export declare enum AutoReplyScope {
    Everyone = 0,
    Stranger = 1,
    SpecificFriends = 2,
    FriendsExcept = 3
}

```

#### Board.d.ts

```typescript
export declare enum BoardType {
    Note = 1,
    PinnedMessage = 2,
    Poll = 3
}
export type PollDetail = {
    creator: string;
    question: string;
    options: PollOptions[];
    joined: boolean;
    closed: boolean;
    poll_id: number;
    allow_multi_choices: boolean;
    allow_add_new_option: boolean;
    is_anonymous: boolean;
    poll_type: number;
    created_time: number;
    updated_time: number;
    expired_time: number;
    is_hide_vote_preview: boolean;
    num_vote: number;
};
export type PollOptions = {
    content: string;
    votes: number;
    voted: boolean;
    voters: string[];
    option_id: number;
};
export type NoteDetail = {
    id: string;
    type: number;
    color: number;
    emoji: string;
    startTime: number;
    duration: number;
    params: {
        title: string;
        extra?: string;
    };
    creatorId: string;
    editorId: string;
    createTime: number;
    editTime: number;
    repeat: number;
};
export type PinnedMessageDetail = {
    id: string;
    type: number;
    color: number;
    emoji: string;
    startTime: number;
    duration: number;
    params: Record<string, unknown>;
    creatorId: string;
    editorId: string;
    createTime: number;
    editTime: number;
    repeat: number;
};

```

#### Catalog.d.ts

```typescript
export type CatalogItem = {
    id: string;
    name: string;
    version: number;
    ownerId: string;
    isDefault: boolean;
    /**
     * Relative path used to build the catalog URL.
     *
     * Example: `https://catalog.zalo.me/${path}`
     */
    path: string;
    catalogPhoto: string | null;
    totalProduct: number;
    created_time: number;
};

```

#### DeliveredMessage.d.ts

```typescript
import { ThreadType } from "./Enum.js";
export type TDeliveredMessage = {
    msgId: string;
    seen: number;
    deliveredUids: string[];
    seenUids: string[];
    realMsgId: string;
    mSTs: number;
};
export type TGroupDeliveredMessage = TDeliveredMessage & {
    groupId: string;
};
export declare class UserDeliveredMessage {
    type: ThreadType.User;
    data: TDeliveredMessage;
    threadId: string;
    isSelf: false;
    constructor(data: TDeliveredMessage);
}
export declare class GroupDeliveredMessage {
    type: ThreadType.Group;
    data: TGroupDeliveredMessage;
    threadId: string;
    isSelf: boolean;
    constructor(uid: string, data: TGroupDeliveredMessage);
}
export type DeliveredMessage = UserDeliveredMessage | GroupDeliveredMessage;

```

#### Enum.d.ts

```typescript
export declare enum ThreadType {
    User = 0,
    Group = 1
}
export declare enum DestType {
    Group = 1,
    User = 3,
    Page = 5
}
export declare enum Gender {
    Male = 0,
    Female = 1
}
export declare enum AvatarSize {
    Small = 120,
    Large = 240
}
/**
 * @note Bank codes list after Mitm on Mobile and Bank's supported by Zalo
 * @documents https://developers.zalo.me/docs/zalo-notification-service/phu-luc/danh-sach-bin-code - docs missing bin code and short_name bank
 */
export declare enum BinBankCard {
    /**
     * NH TMCP An BÃ¬nh
     */
    ABBank = 970425,
    /**
     * NH TMCP Ã ChÃ¢u
     */
    ACB = 970416,
    /**
     * NH NÃ´ng nghiá»‡p vÃ  PhÃ¡t triá»ƒn NÃ´ng thÃ´n Viá»‡t Nam
     */
    Agribank = 970405,
    /**
     * NH TMCP Äáº§u tÆ° vÃ  PhÃ¡t triá»ƒn Viá»‡t Nam
     */
    BIDV = 970418,
    /**
     * NH TMCP Báº£n Viá»‡t
     */
    BVBank = 970454,
    /**
     * NH TMCP Báº¯c Ã
     */
    BacA_Bank = 970409,
    /**
     * NH TMCP Báº£o Viá»‡t
     */
    BaoViet_Bank = 970438,
    /**
     * NH sá»‘ CAKE by VPBank - TMCP Viá»‡t Nam Thá»‹nh VÆ°á»£ng
     */
    CAKE = 546034,
    /**
     * NH ThÆ°Æ¡ng máº¡i TNHH MTV XÃ¢y dá»±ng Viá»‡t Nam
     */
    CB_Bank = 970444,
    /**
     * NH TNHH MTV CIMB Viá»‡t Nam
     */
    CIMB_Bank = 422589,
    /**
     * NH Há»£p tÃ¡c xÃ£ Viá»‡t Nam
     */
    Coop_Bank = 970446,
    /**
     * NH TNHH MTV PhÃ¡t triá»ƒn Singapore - CN TP. Há»“ ChÃ­ Minh
     */
    DBS_Bank = 796500,
    /**
     * NH TMCP ÄÃ´ng Ã
     */
    DongA_Bank = 970406,
    /**
     * NH TMCP Xuáº¥t Nháº­p kháº©u Viá»‡t Nam
     */
    Eximbank = 970431,
    /**
     * NH TMCP Dáº§u khÃ­ ToÃ n cáº§u
     */
    GPBank = 970408,
    /**
     * NH TMCP PhÃ¡t triá»ƒn TP. Há»“ ChÃ­ Minh
     */
    HDBank = 970437,
    /**
     * NH TNHH MTV HSBC (Viá»‡t Nam)
     */
    HSBC = 458761,
    /**
     * NH TNHH MTV Hong Leong Viá»‡t Nam
     */
    HongLeong_Bank = 970442,
    /**
     * NH CÃ´ng nghiá»‡p HÃ n Quá»‘c - CN TP. Há»“ ChÃ­ Minh
     */
    IBK_HCM = 970456,
    /**
     * NH CÃ´ng nghiá»‡p HÃ n Quá»‘c - CN HÃ  Ná»™i
     */
    IBK_HN = 970455,
    /**
     * NH TNHH Indovina
     */
    Indovina_Bank = 970434,
    /**
     * NH Äáº¡i chÃºng TNHH Kasikornbank - CN TP. Há»“ ChÃ­ Minh
     */
    KBank = 668888,
    /**
     * NH TMCP KiÃªn Long
     */
    KienlongBank = 970452,
    /**
     * NH Kookmin - CN TP. Há»“ ChÃ­ Minh
     */
    Kookmin_Bank_HCM = 970463,
    /**
     * NH Kookmin - CN HÃ  Ná»™i
     */
    Kookmin_Bank_HN = 970462,
    /**
     * NH TMCP Lá»™c PhÃ¡t Viá»‡t Nam
     */
    LPBank = 970449,
    /**
     * NH TMCP QuÃ¢n Ä‘á»™i
     */
    MB_Bank = 970422,
    /**
     * NH TMCP HÃ ng Háº£i
     */
    MSB = 970426,
    /**
     * NH TMCP Quá»‘c DÃ¢n
     */
    NCB = 970419,
    /**
     * NH TMCP Nam Ã
     */
    Nam_A_Bank = 970428,
    /**
     * NH Nonghyup - CN HÃ  Ná»™i
     */
    NongHyup_Bank = 801011,
    /**
     * NH TMCP PhÆ°Æ¡ng ÄÃ´ng
     */
    OCB = 970448,
    /**
     * NH ThÆ°Æ¡ng máº¡i TNHH MTV Äáº¡i DÆ°Æ¡ng
     */
    Ocean_Bank = 970414,
    /**
     * NH TMCP Thá»‹nh vÆ°á»£ng vÃ  PhÃ¡t triá»ƒn
     */
    PGBank = 970430,
    /**
     * NH TMCP Äáº¡i ChÃºng Viá»‡t Nam
     */
    PVcomBank = 970412,
    /**
     * NH TNHH MTV Public Viá»‡t Nam
     */
    Public_Bank_Vietnam = 970439,
    /**
     * NH TMCP SÃ i GÃ²n
     */
    SCB = 970429,
    /**
     * NH TMCP SÃ i GÃ²n - HÃ  Ná»™i
     */
    SHB = 970443,
    /**
     * NH TMCP SÃ i GÃ²n ThÆ°Æ¡ng TÃ­n
     */
    Sacombank = 970403,
    /**
     * NH TMCP SÃ i GÃ²n CÃ´ng ThÆ°Æ¡ng
     */
    Saigon_Bank = 970400,
    /**
     * NH TMCP ÄÃ´ng Nam Ã
     */
    SeABank = 970440,
    /**
     * NH TNHH MTV Shinhan Viá»‡t Nam
     */
    Shinhan_Bank = 970424,
    /**
     * NH TNHH MTV Standard Chartered Bank Viá»‡t Nam
     */
    Standard_Chartered_Vietnam = 970410,
    /**
     * NH sá»‘ TNEX
     */
    TNEX = 9704261,
    /**
     * NH TMCP TiÃªn Phong
     */
    TPBank = 970423,
    /**
     * NH TMCP Ká»¹ thÆ°Æ¡ng Viá»‡t Nam
     */
    Techcombank = 970407,
    /**
     * NH sá»‘ Timo by Báº£n Viá»‡t Bank
     */
    Timo = 963388,
    /**
     * NH sá»‘ UBank by VPBank
     */
    UBank = 546035,
    /**
     * NH United Overseas Bank Viá»‡t Nam
     */
    United_Overseas_Bank_Vietnam = 970458,
    /**
     * NH TMCP Quá»‘c táº¿ Viá»‡t Nam
     */
    VIB = 970441,
    /**
     * NH TMCP Viá»‡t Nam Thá»‹nh VÆ°á»£ng
     */
    VPBank = 970432,
    /**
     * NH LiÃªn doanh Viá»‡t - Nga
     */
    VRB = 970421,
    /**
     * NH TMCP Viá»‡t Ã
     */
    VietABank = 970427,
    /**
     * NH TMCP Viá»‡t Nam ThÆ°Æ¡ng TÃ­n
     */
    VietBank = 970433,
    /**
     * NH TMCP Ngoáº¡i ThÆ°Æ¡ng Viá»‡t Nam
     */
    Vietcombank = 970436,
    /**
     * NH TMCP CÃ´ng thÆ°Æ¡ng Viá»‡t Nam
     */
    VietinBank = 970415,
    /**
     * NH TNHH MTV Woori Viá»‡t Nam
     */
    Woori_Bank = 970457
}

```

#### FriendEvent.d.ts

```typescript
export declare enum FriendEventType {
    ADD = 0,
    REMOVE = 1,
    REQUEST = 2,
    UNDO_REQUEST = 3,
    REJECT_REQUEST = 4,
    SEEN_FRIEND_REQUEST = 5,
    BLOCK = 6,
    UNBLOCK = 7,
    BLOCK_CALL = 8,
    UNBLOCK_CALL = 9,
    PIN_UNPIN = 10,
    PIN_CREATE = 11,
    UNKNOWN = 12
}
export type TFriendEventBase = string;
export type TFriendEventRejectUndo = {
    toUid: string;
    fromUid: string;
};
export type TFriendEventRequest = {
    toUid: string;
    fromUid: string;
    src: number;
    message: string;
};
export type TFriendEventSeenRequest = string[];
export type TFriendEventPinCreateTopicParams = {
    senderUid: string;
    senderName: string;
    client_msg_id: string;
    global_msg_id: string;
    msg_type: number;
    title: string;
};
export type TFriendEventPinTopic = {
    topicId: string;
    topicType: number;
};
export type TFriendEventPinCreateTopic = {
    type: number;
    color: number;
    emoji: string;
    startTime: number;
    duration: number;
    params: TFriendEventPinCreateTopicParams;
    id: string;
    creatorId: string;
    createTime: number;
    editorId: string;
    editTime: number;
    repeat: number;
    action: number;
};
export type TFriendEventPinCreate = {
    oldTopic?: TFriendEventPinTopic;
    topic: TFriendEventPinCreateTopic;
    actorId: string;
    oldVersion: number;
    version: number;
    conversationId: string;
};
export type TFriendEventPinUnpin = {
    topic: TFriendEventPinTopic;
    actorId: string;
    oldVersion: number;
    version: number;
    conversationId: string;
};
export type TFriendEvent = TFriendEventBase | TFriendEventRequest | TFriendEventRejectUndo | TFriendEventSeenRequest | TFriendEventPinUnpin | TFriendEventPinCreate;
export type FriendEvent = {
    type: FriendEventType.ADD | FriendEventType.REMOVE | FriendEventType.BLOCK | FriendEventType.UNBLOCK | FriendEventType.BLOCK_CALL | FriendEventType.UNBLOCK_CALL;
    data: TFriendEventBase;
    threadId: string;
    isSelf: boolean;
} | {
    type: FriendEventType.REJECT_REQUEST | FriendEventType.UNDO_REQUEST;
    data: TFriendEventRejectUndo;
    threadId: string;
    isSelf: boolean;
} | {
    type: FriendEventType.REQUEST;
    data: TFriendEventRequest;
    threadId: string;
    isSelf: boolean;
} | {
    type: FriendEventType.SEEN_FRIEND_REQUEST;
    data: TFriendEventSeenRequest;
    threadId: string;
    isSelf: boolean;
} | {
    type: FriendEventType.PIN_CREATE;
    data: TFriendEventPinCreate;
    threadId: string;
    isSelf: boolean;
} | {
    type: FriendEventType.PIN_UNPIN;
    data: TFriendEventPinUnpin;
    threadId: string;
    isSelf: boolean;
} | {
    type: FriendEventType.UNKNOWN;
    data: string;
    threadId: string;
    isSelf: boolean;
};
export declare function initializeFriendEvent(uid: string, data: TFriendEvent, type: FriendEventType): FriendEvent;

```

#### Group.d.ts

```typescript
export type GroupSetting = {
    blockName: number;
    signAdminMsg: number;
    addMemberOnly: number;
    setTopicOnly: number;
    enableMsgHistory: number;
    joinAppr: number;
    lockCreatePost: number;
    lockCreatePoll: number;
    lockSendMsg: number;
    lockViewMember: number;
    bannFeature: number;
    dirtyMedia: number;
    banDuration: number;
};
export declare enum GroupTopicType {
    Note = 0,
    Message = 2,
    Poll = 3
}
export type GroupTopicNoteParams = {
    client_msg_id: string;
    global_msg_id: string;
    title: string;
};
export type GroupTopicTextMessageParams = {
    senderUid: string;
    senderName: string;
    client_msg_id: string;
    global_msg_id: string;
    msg_type: 1;
    title: string;
};
export type GroupTopicVoiceMessageParams = GroupTopicImageMessageParams & {
    msg_type: 31;
};
export type GroupTopicImageMessageParams = GroupTopicTextMessageParams & {
    msg_type: 32;
    thumb: string;
};
export type GroupTopicVideoMessageParams = GroupTopicTextMessageParams & {
    msg_type: 44;
    thumb: string;
};
export type GroupTopicFileMessageParams = GroupTopicTextMessageParams & {
    msg_type: 46;
    extra: {
        fileSize: string;
        checksum: string;
        checksumSha: unknown;
        fileExt: string;
        fdata: string;
        fType: number;
    };
};
export type GroupTopicGifMessageParams = GroupTopicTextMessageParams & {
    msg_type: 49;
    thumb: string;
};
export type GroupTopicMessageParams = GroupTopicTextMessageParams | GroupTopicVoiceMessageParams | GroupTopicImageMessageParams | GroupTopicVideoMessageParams | GroupTopicFileMessageParams | GroupTopicGifMessageParams;
export type GroupTopicPollParams = {
    pollId: number;
    title: string;
};
export type GroupTopicOtherParams = {
    [key: string]: unknown;
};
export type GroupTopic = {
    type: GroupTopicType;
    color: number;
    emoji: string;
    startTime: number;
    duration: number;
    params: GroupTopicNoteParams | GroupTopicMessageParams | GroupTopicPollParams | GroupTopicOtherParams;
    id: string;
    creatorId: string;
    createTime: number;
    editorId: string;
    editTime: number;
    repeat: number;
    action: number;
};
export declare enum GroupType {
    Group = 1,
    Community = 2
}
export type GroupCurrentMem = {
    id: string;
    dName: string;
    zaloName: string;
    avatar: string;
    avatar_25: string;
    accountStatus: number;
    type: number;
};
export type GroupInfo = {
    groupId: string;
    name: string;
    desc: string;
    type: GroupType;
    creatorId: string;
    version: string;
    avt: string;
    fullAvt: string;
    memberIds: string[];
    adminIds: string[];
    currentMems: GroupCurrentMem[];
    updateMems: unknown[];
    admins: unknown[];
    hasMoreMember: number;
    subType: number;
    totalMember: number;
    maxMember: number;
    setting: GroupSetting;
    createdTime: number;
    visibility: number;
    globalId: string;
    /**
     * 1: True, 0: False
     */
    e2ee: number;
    extraInfo: {
        enable_media_store: number;
    };
};

```

#### GroupEvent.d.ts

```typescript
import type { GroupSetting, GroupTopic } from "./Group.js";
import type { ReminderGroup } from "./Reminder.js";
export declare enum GroupEventType {
    JOIN_REQUEST = "join_request",
    JOIN = "join",
    LEAVE = "leave",
    REMOVE_MEMBER = "remove_member",
    BLOCK_MEMBER = "block_member",
    UPDATE_SETTING = "update_setting",
    UPDATE = "update",
    NEW_LINK = "new_link",
    ADD_ADMIN = "add_admin",
    REMOVE_ADMIN = "remove_admin",
    NEW_PIN_TOPIC = "new_pin_topic",
    UPDATE_PIN_TOPIC = "update_pin_topic",
    REORDER_PIN_TOPIC = "reorder_pin_topic",
    UPDATE_BOARD = "update_board",
    REMOVE_BOARD = "remove_board",
    UPDATE_TOPIC = "update_topic",
    UNPIN_TOPIC = "unpin_topic",
    REMOVE_TOPIC = "remove_topic",
    ACCEPT_REMIND = "accept_remind",
    REJECT_REMIND = "reject_remind",
    REMIND_TOPIC = "remind_topic",
    UPDATE_AVATAR = "update_avatar",
    UNKNOWN = "unknown"
}
export type GroupEventUpdateMember = {
    id: string;
    dName: string;
    avatar: string;
    type: number;
    avatar_25: string;
};
export type GroupEventGroupInfo = {
    group_link?: string;
    link_expired_time?: number;
    [key: string]: unknown;
};
export type GroupEventExtraData = {
    featureId?: number;
    field?: string;
    [key: string]: unknown;
};
export type TGroupEventBase = {
    subType: number;
    groupId: string;
    creatorId: string;
    groupName: string;
    sourceId: string;
    updateMembers: GroupEventUpdateMember[];
    groupSetting: GroupSetting | null;
    groupTopic: GroupTopic | null;
    info: GroupEventGroupInfo | null;
    extraData: GroupEventExtraData | null;
    time: string;
    avt: string | null;
    fullAvt: string | null;
    isAdd: number;
    hideGroupInfo: number;
    version: string;
    groupType: number;
    clientId?: number;
    errorMap?: Record<string, unknown>;
    e2ee?: number;
};
export type TGroupEventJoinRequest = {
    uids: string[];
    totalPending: number;
    groupId: string;
    time: string;
};
export type TGroupEventPinTopic = {
    oldBoardVersion: number;
    boardVersion: number;
    topic: GroupTopic;
    actorId: string;
    groupId: string;
};
export type TGroupEventReorderPinTopic = {
    oldBoardVersion: number;
    actorId: string;
    topics: {
        topicId: string;
        topicType: number;
    }[];
    groupId: string;
    boardVersion: number;
    topic: null;
};
export type TGroupEventBoard = {
    sourceId: string;
    groupName: string;
    groupTopic: (GroupTopic | ReminderGroup) & {
        params: string;
    };
    groupId: string;
    creatorId: string;
    subType?: number;
    updateMembers?: GroupEventUpdateMember[];
    groupSetting?: GroupSetting;
    info?: GroupEventGroupInfo;
    extraData?: GroupEventExtraData;
    time?: string;
    avt?: null;
    fullAvt?: null;
    isAdd?: number;
    hideGroupInfo?: number;
    version?: string;
    groupType?: number;
};
export type TGroupEventRemindRespond = {
    topicId: string;
    updateMembers: string[];
    groupId: string;
    time: string;
};
export type TGroupEventRemindTopic = {
    msg: string;
    editorId: string;
    color: string;
    emoji: string;
    creatorId: string;
    editTime: number;
    type: number;
    duration: number;
    group_id: string;
    createTime: number;
    repeat: number;
    startTime: number;
    time: number;
    remindType: number;
};
export type TGroupEvent = TGroupEventBase | TGroupEventJoinRequest | TGroupEventPinTopic | TGroupEventReorderPinTopic | TGroupEventBoard | TGroupEventRemindRespond | TGroupEventRemindTopic;
export type GroupEvent = {
    type: GroupEventType.JOIN_REQUEST;
    data: TGroupEventJoinRequest;
    act: string;
    threadId: string;
    isSelf: boolean;
} | {
    type: GroupEventType.NEW_PIN_TOPIC | GroupEventType.UNPIN_TOPIC | GroupEventType.UPDATE_PIN_TOPIC;
    data: TGroupEventPinTopic;
    act: string;
    threadId: string;
    isSelf: boolean;
} | {
    type: GroupEventType.REORDER_PIN_TOPIC;
    data: TGroupEventReorderPinTopic;
    act: string;
    threadId: string;
    isSelf: boolean;
} | {
    type: GroupEventType.UPDATE_BOARD | GroupEventType.REMOVE_BOARD;
    data: TGroupEventBoard;
    act: string;
    threadId: string;
    isSelf: boolean;
} | {
    type: GroupEventType.ACCEPT_REMIND | GroupEventType.REJECT_REMIND;
    data: TGroupEventRemindRespond;
    act: string;
    threadId: string;
    isSelf: boolean;
} | {
    type: GroupEventType.REMIND_TOPIC;
    data: TGroupEventRemindTopic;
    act: string;
    threadId: string;
    isSelf: boolean;
} | {
    type: Exclude<GroupEventType, GroupEventType.JOIN_REQUEST | GroupEventType.NEW_PIN_TOPIC | GroupEventType.UNPIN_TOPIC | GroupEventType.UPDATE_PIN_TOPIC | GroupEventType.REORDER_PIN_TOPIC | GroupEventType.UPDATE_BOARD | GroupEventType.REMOVE_BOARD | GroupEventType.ACCEPT_REMIND | GroupEventType.REJECT_REMIND | GroupEventType.REMIND_TOPIC>;
    data: TGroupEventBase;
    act: string;
    threadId: string;
    isSelf: boolean;
};
export declare function initializeGroupEvent(uid: string, data: TGroupEvent, type: GroupEventType, act: string): GroupEvent;

```

#### index.d.ts

```typescript
export * from "./Attachment.js";
export * from "./AutoReply.js";
export * from "./Board.js";
export * from "./Catalog.js";
export * from "./DeliveredMessage.js";
export * from "./Enum.js";
export * from "./FriendEvent.js";
export * from "./Group.js";
export * from "./GroupEvent.js";
export * from "./Message.js";
export * from "./ProductCatalog.js";
export * from "./QuickMessage.js";
export * from "./Reaction.js";
export * from "./Reminder.js";
export * from "./SeenMessage.js";
export * from "./Typing.js";
export * from "./Undo.js";
export * from "./User.js";
export * from "./ZBusiness.js";
export * from "./Label.js";
export * from "./Sticker.js";

```

#### Label.d.ts

```typescript
export type LabelData = {
    id: number;
    text: string;
    textKey: string;
    conversations: string[];
    color: string;
    offset: number;
    emoji: string;
    createTime: number;
};

```

#### Message.d.ts

```typescript
import { ThreadType } from "./Enum.js";
export type TAttachmentContent = {
    title: string;
    description: string;
    href: string;
    thumb: string;
    childnumber: number;
    action: string;
    params: string;
    type: string;
};
export type TOtherContent = {
    [key: string]: unknown;
};
export type TMessage = {
    actionId: string;
    msgId: string;
    cliMsgId: string;
    msgType: string;
    uidFrom: string;
    idTo: string;
    dName: string;
    ts: string;
    status: number;
    content: string | TAttachmentContent | TOtherContent;
    notify: string;
    ttl: number;
    userId: string;
    uin: string;
    topOut: string;
    topOutTimeOut: string;
    topOutImprTimeOut: string;
    propertyExt: {
        color: number;
        size: number;
        type: number;
        subType: number;
        ext: string;
    } | undefined;
    paramsExt: {
        countUnread: number;
        containType: number;
        platformType: number;
    };
    cmd: number;
    st: number;
    at: number;
    realMsgId: string;
    quote: TQuote | undefined;
};
export type TGroupMessage = TMessage & {
    mentions: TMention[] | undefined;
};
export type TQuote = {
    ownerId: string;
    cliMsgId: number;
    globalMsgId: number;
    cliMsgType: number;
    ts: number;
    msg: string;
    attach: string;
    fromD: string;
    ttl: number;
};
export type TMention = {
    uid: string;
    pos: number;
    len: number;
    type: 0 | 1;
};
export declare class UserMessage {
    type: ThreadType.User;
    data: TMessage;
    threadId: string;
    /**
     * true if the message is sent by the logged in account
     */
    isSelf: boolean;
    constructor(uid: string, data: TMessage);
}
export declare class GroupMessage {
    type: ThreadType.Group;
    data: TGroupMessage;
    threadId: string;
    /**
     * true if the message is sent by the logged in account
     */
    isSelf: boolean;
    constructor(uid: string, data: TGroupMessage);
}
export type Message = UserMessage | GroupMessage;

```

#### ProductCatalog.d.ts

```typescript
export type ProductCatalogItem = {
    price: string;
    description: string;
    /**
     * Relative path used to build the product URL.
     *
     * Example: https://catalog.zalo.me/${path}
     */
    path: string;
    product_id: string;
    product_name: string;
    currency_unit: string;
    product_photos: string[];
    create_time: number;
    catalog_id: string;
    owner_id: string;
};

```

#### QuickMessage.d.ts

```typescript
export type QuickMessage = {
    id: number;
    keyword: string;
    type: number;
    createdTime: number;
    lastModified: number;
    message: {
        title: string;
        params: string | null;
    };
    media: {
        items: {
            type: number;
            photoId: number;
            title: string;
            width: number;
            height: number;
            previewThumb: string;
            rawUrl: string;
            thumbUrl: string;
            normalUrl: string;
            hdUrl: string;
        }[];
    } | null;
};

```

#### Reaction.d.ts

```typescript
export declare enum Reactions {
    HEART = "/-heart",
    LIKE = "/-strong",
    HAHA = ":>",
    WOW = ":o",
    CRY = ":-((",
    ANGRY = ":-h",
    KISS = ":-*",
    TEARS_OF_JOY = ":')",
    SHIT = "/-shit",
    ROSE = "/-rose",
    BROKEN_HEART = "/-break",
    DISLIKE = "/-weak",
    LOVE = ";xx",
    CONFUSED = ";-/",
    WINK = ";-)",
    FADE = "/-fade",
    SUN = "/-li",
    BIRTHDAY = "/-bd",
    BOMB = "/-bome",
    OK = "/-ok",
    PEACE = "/-v",
    THANKS = "/-thanks",
    PUNCH = "/-punch",
    SHARE = "/-share",
    PRAY = "_()_",
    NO = "/-no",
    BAD = "/-bad",
    LOVE_YOU = "/-loveu",
    SAD = "--b",
    VERY_SAD = ":((",
    COOL = "x-)",
    NERD = "8-)",
    BIG_SMILE = ";-d",
    SUNGLASSES = "b-)",
    NEUTRAL = ":--|",
    SAD_FACE = "p-(",
    BYE = ":-bye",
    SLEEPY = "|-)",
    WIPE = ":wipe",
    DIG = ":-dig",
    ANGUISH = "&-(",
    HANDCLAP = ":handclap",
    ANGRY_FACE = ">-|",
    F_CHAIR = ":-f",
    L_CHAIR = ":-l",
    R_CHAIR = ":-r",
    SILENT = ";-x",
    SURPRISE = ":-o",
    EMBARRASSED = ";-s",
    AFRAID = ";-a",
    SAD2 = ":-<",
    BIG_LAUGH = ":))",
    RICH = "$-)",
    BEER = "/-beer",
    NONE = ""
}
export type TReaction = {
    actionId: string;
    msgId: string;
    cliMsgId: string;
    msgType: string;
    uidFrom: string;
    idTo: string;
    dName?: string;
    content: {
        rMsg: {
            gMsgID: string;
            cMsgID: string;
            msgType: number;
        }[];
        rIcon: Reactions;
        rType: number;
        source: number;
    };
    ts: string;
    ttl: number;
};
export declare class Reaction {
    data: TReaction;
    threadId: string;
    isSelf: boolean;
    isGroup: boolean;
    constructor(uid: string, data: TReaction, isGroup: boolean);
}

```

#### Reminder.d.ts

```typescript
export declare enum ReminderRepeatMode {
    None = 0,
    Daily = 1,
    Weekly = 2,
    Monthly = 3
}
export type ReminderUser = {
    creatorUid: string;
    toUid: string;
    emoji: string;
    color: number;
    reminderId: string;
    createTime: number;
    repeat: ReminderRepeatMode;
    startTime: number;
    editTime: number;
    endTime: number;
    params: {
        title: string;
        setTitle: boolean;
    };
    type: number;
};
export type ReminderGroup = {
    editorId: string;
    emoji: string;
    color: number;
    groupId: string;
    creatorId: string;
    editTime: number;
    eventType: number;
    responseMem: {
        rejectMember: number;
        myResp: number;
        acceptMember: number;
    };
    params: {
        title: string;
        setTitle?: boolean;
    };
    type: number;
    duration: number;
    repeatInfo: {
        list_ts: unknown[];
    } | null;
    repeatData: unknown[];
    createTime: number;
    repeat: ReminderRepeatMode;
    startTime: number;
    id: string;
};

```

#### SeenMessage.d.ts

```typescript
import { ThreadType } from "./Enum.js";
export type TUserSeenMessage = {
    idTo: string;
    msgId: string;
    realMsgId: string;
};
export type TGroupSeenMessage = {
    msgId: string;
    groupId: string;
    seenUids: string[];
};
export declare class UserSeenMessage {
    type: ThreadType.User;
    data: TUserSeenMessage;
    threadId: string;
    isSelf: false;
    constructor(data: TUserSeenMessage);
}
export declare class GroupSeenMessage {
    type: ThreadType.Group;
    data: TGroupSeenMessage;
    threadId: string;
    isSelf: boolean;
    constructor(uid: string, data: TGroupSeenMessage);
}
export type SeenMessage = UserSeenMessage | GroupSeenMessage;

```

#### Sticker.d.ts

```typescript
export type StickerDetail = {
    id: number;
    cateId: number;
    type: number;
    text: string;
    uri: string;
    fkey: number;
    status: number;
    stickerUrl: string;
    stickerSpriteUrl: string;
    stickerWebpUrl: string | null;
    totalFrames: number;
    duration: number;
    effectId: number;
    checksum: string;
    ext: number;
    source: number;
    fss: unknown;
    fssInfo: unknown;
    version: number;
    extInfo: unknown;
};
export type StickerBasic = {
    type: number;
    cate_id: number;
    sticker_id: number;
};

```

#### Typing.d.ts

```typescript
import { ThreadType } from "./Enum.js";
export type TTyping = {
    uid: string;
    ts: string;
    isPC: 0 | 1;
};
export type TGroupTyping = TTyping & {
    gid: string;
};
export declare class UserTyping {
    type: ThreadType.User;
    data: TTyping;
    threadId: string;
    isSelf: false;
    constructor(data: TTyping);
}
export declare class GroupTyping {
    type: ThreadType.Group;
    data: TGroupTyping;
    threadId: string;
    isSelf: false;
    constructor(data: TGroupTyping);
}
export type Typing = UserTyping | GroupTyping;

```

#### Undo.d.ts

```typescript
export type TUndoContent = {
    globalMsgId: number;
    cliMsgId: number;
    deleteMsg: number;
    srcId: number;
    destId: number;
};
export type TUndo = {
    actionId: string;
    msgId: string;
    cliMsgId: string;
    msgType: string;
    uidFrom: string;
    idTo: string;
    dName: string;
    ts: string;
    status: number;
    content: TUndoContent;
    notify: string;
    ttl: number;
    userId: string;
    uin: string;
    cmd: number;
    st: number;
    at: number;
    realMsgId: string;
};
export declare class Undo {
    data: TUndo;
    threadId: string;
    isSelf: boolean;
    isGroup: boolean;
    constructor(uid: string, data: TUndo, isGroup: boolean);
}

```

#### User.d.ts

```typescript
import type { Gender } from "./Enum.js";
import type { ZBusinessPackage } from "./ZBusiness.js";
export type User = {
    userId: string;
    username: string;
    displayName: string;
    zaloName: string;
    avatar: string;
    bgavatar: string;
    cover: string;
    gender: Gender;
    dob: number;
    sdob: string;
    status: string;
    phoneNumber: string;
    isFr: number;
    isBlocked: number;
    lastActionTime: number;
    lastUpdateTime: number;
    isActive: number;
    key: number;
    type: number;
    isActivePC: number;
    isActiveWeb: number;
    isValid: number;
    userKey: string;
    accountStatus: number;
    oaInfo: unknown;
    user_mode: number;
    globalId: string;
    bizPkg: ZBusinessPackage;
    createdTs: number;
    oa_status: unknown;
};
export type UserBasic = {
    avatar: string;
    cover: string;
    status: string;
    gender: Gender;
    dob: number;
    sdob: string;
    globalId: string;
    bizPkg: ZBusinessPackage;
    uid: string;
    zalo_name: string;
    display_name: string;
};
export type UserSetting = {
    add_friend_via_contact: number;
    display_on_recommend_friend: number;
    add_friend_via_group: number;
    add_friend_via_qr: number;
    quick_message_status: number;
    show_online_status: boolean;
    accept_stranger_call: number;
    archived_chat_status: number;
    receive_message: number;
    add_friend_via_phone: number;
    display_seen_status: number;
    view_birthday: number;
    setting_2FA_status: number;
};

```

#### ZBusiness.d.ts

```typescript
export type ZBusinessPackage = {
    label?: Record<string, string> | null;
    pkgId: number;
};
export declare enum BusinessCategory {
    Other = 0,
    RealEstate = 1,
    TechnologyAndDevices = 2,
    TravelAndHospitality = 3,
    EducationAndTraining = 4,
    ShoppingAndRetail = 5,
    CosmeticsAndBeauty = 6,
    RestaurantAndCafe = 7,
    AutoAndMotorbike = 8,
    FashionAndApparel = 9,
    FoodAndBeverage = 10,
    MediaAndEntertainment = 11,
    InternalCommunications = 12,
    Transportation = 13,
    Telecommunications = 14
}
export declare const BusinessCategoryName: Record<BusinessCategory, string>;

```


---

## PHẦN B — ls dist/apis/ và toàn bộ apis/*.d.ts

### B.1 ls dist/apis

```
acceptFriendRequest.d.ts
acceptFriendRequest.js
addGroupBlockedMember.d.ts
addGroupBlockedMember.js
addGroupDeputy.d.ts
addGroupDeputy.js
addPollOptions.d.ts
addPollOptions.js
addQuickMessage.d.ts
addQuickMessage.js
addReaction.d.ts
addReaction.js
addUnreadMark.d.ts
addUnreadMark.js
addUserToGroup.d.ts
addUserToGroup.js
blockUser.d.ts
blockUser.js
blockViewFeed.d.ts
blockViewFeed.js
changeAccountAvatar.d.ts
changeAccountAvatar.js
changeFriendAlias.d.ts
changeFriendAlias.js
changeGroupAvatar.d.ts
changeGroupAvatar.js
changeGroupName.d.ts
changeGroupName.js
changeGroupOwner.d.ts
changeGroupOwner.js
createAutoReply.d.ts
createAutoReply.js
createCatalog.d.ts
createCatalog.js
createGroup.d.ts
createGroup.js
createNote.d.ts
createNote.js
createPoll.d.ts
createPoll.js
createProductCatalog.d.ts
createProductCatalog.js
createReminder.d.ts
createReminder.js
custom.d.ts
custom.js
deleteAutoReply.d.ts
deleteAutoReply.js
deleteAvatar.d.ts
deleteAvatar.js
deleteCatalog.d.ts
deleteCatalog.js
deleteChat.d.ts
deleteChat.js
deleteGroupInviteBox.d.ts
deleteGroupInviteBox.js
deleteMessage.d.ts
deleteMessage.js
deleteProductCatalog.d.ts
deleteProductCatalog.js
disableGroupLink.d.ts
disableGroupLink.js
disperseGroup.d.ts
disperseGroup.js
editNote.d.ts
editNote.js
editReminder.d.ts
editReminder.js
enableGroupLink.d.ts
enableGroupLink.js
fetchAccountInfo.d.ts
fetchAccountInfo.js
findUser.d.ts
findUser.js
findUserByUsername.d.ts
findUserByUsername.js
forwardMessage.d.ts
forwardMessage.js
getAliasList.d.ts
getAliasList.js
getAllFriends.d.ts
getAllFriends.js
getAllGroups.d.ts
getAllGroups.js
getArchivedChatList.d.ts
getArchivedChatList.js
getAutoDeleteChat.d.ts
getAutoDeleteChat.js
getAutoReplyList.d.ts
getAutoReplyList.js
getAvatarList.d.ts
getAvatarList.js
getAvatarUrlProfile.d.ts
getAvatarUrlProfile.js
getBizAccount.d.ts
getBizAccount.js
getCatalogList.d.ts
getCatalogList.js
getCloseFriends.d.ts
getCloseFriends.js
getContext.d.ts
getContext.js
getCookie.d.ts
getCookie.js
getFriendBoardList.d.ts
getFriendBoardList.js
getFriendOnlines.d.ts
getFriendOnlines.js
getFriendRecommendations.d.ts
getFriendRecommendations.js
getFriendRequestStatus.d.ts
getFriendRequestStatus.js
getFullAvatar.d.ts
getFullAvatar.js
getGroupBlockedMember.d.ts
getGroupBlockedMember.js
getGroupChatHistory.d.ts
getGroupChatHistory.js
getGroupInfo.d.ts
getGroupInfo.js
getGroupInviteBoxInfo.d.ts
getGroupInviteBoxInfo.js
getGroupInviteBoxList.d.ts
getGroupInviteBoxList.js
getGroupLinkDetail.d.ts
getGroupLinkDetail.js
getGroupLinkInfo.d.ts
getGroupLinkInfo.js
getGroupMembersInfo.d.ts
getGroupMembersInfo.js
getHiddenConversations.d.ts
getHiddenConversations.js
getLabels.d.ts
getLabels.js
getListBoard.d.ts
getListBoard.js
getListReminder.d.ts
getListReminder.js
getMultiUsersByPhones.d.ts
getMultiUsersByPhones.js
getMute.d.ts
getMute.js
getOwnId.d.ts
getOwnId.js
getPendingGroupMembers.d.ts
getPendingGroupMembers.js
getPinConversations.d.ts
getPinConversations.js
getPollDetail.d.ts
getPollDetail.js
getProductCatalogList.d.ts
getProductCatalogList.js
getQR.d.ts
getQR.js
getQuickMessageList.d.ts
getQuickMessageList.js
getRelatedFriendGroup.d.ts
getRelatedFriendGroup.js
getReminder.d.ts
getReminder.js
getReminderResponses.d.ts
getReminderResponses.js
getSentFriendRequest.d.ts
getSentFriendRequest.js
getSettings.d.ts
getSettings.js
getStickerCategoryDetail.d.ts
getStickerCategoryDetail.js
getStickers.d.ts
getStickers.js
getStickersDetail.d.ts
getStickersDetail.js
getUnreadMark.d.ts
getUnreadMark.js
getUserInfo.d.ts
getUserInfo.js
inviteUserToGroups.d.ts
inviteUserToGroups.js
joinGroupInviteBox.d.ts
joinGroupInviteBox.js
joinGroupLink.d.ts
joinGroupLink.js
keepAlive.d.ts
keepAlive.js
lastOnline.d.ts
lastOnline.js
leaveGroup.d.ts
leaveGroup.js
listen.d.ts
listen.js
lockPoll.d.ts
lockPoll.js
login.d.ts
login.js
loginQR.d.ts
loginQR.js
parseLink.d.ts
parseLink.js
rejectFriendRequest.d.ts
rejectFriendRequest.js
removeFriend.d.ts
removeFriend.js
removeFriendAlias.d.ts
removeFriendAlias.js
removeGroupBlockedMember.d.ts
removeGroupBlockedMember.js
removeGroupDeputy.d.ts
removeGroupDeputy.js
removeQuickMessage.d.ts
removeQuickMessage.js
removeReminder.d.ts
removeReminder.js
removeUnreadMark.d.ts
removeUnreadMark.js
removeUserFromGroup.d.ts
removeUserFromGroup.js
resetHiddenConversPin.d.ts
resetHiddenConversPin.js
reuseAvatar.d.ts
reuseAvatar.js
reviewPendingMemberRequest.d.ts
reviewPendingMemberRequest.js
searchSticker.d.ts
searchSticker.js
sendBankCard.d.ts
sendBankCard.js
sendCard.d.ts
sendCard.js
sendDeliveredEvent.d.ts
sendDeliveredEvent.js
sendFriendRequest.d.ts
sendFriendRequest.js
sendLink.d.ts
sendLink.js
sendMessage.d.ts
sendMessage.js
sendReport.d.ts
sendReport.js
sendSeenEvent.d.ts
sendSeenEvent.js
sendSticker.d.ts
sendSticker.js
sendTypingEvent.d.ts
sendTypingEvent.js
sendVideo.d.ts
sendVideo.js
sendVoice.d.ts
sendVoice.js
setHiddenConversations.d.ts
setHiddenConversations.js
setMute.d.ts
setMute.js
setPinnedConversations.d.ts
setPinnedConversations.js
sharePoll.d.ts
sharePoll.js
unblockUser.d.ts
unblockUser.js
undo.d.ts
undo.js
undoFriendRequest.d.ts
undoFriendRequest.js
updateActiveStatus.d.ts
updateActiveStatus.js
updateArchivedChatList.d.ts
updateArchivedChatList.js
updateAutoDeleteChat.d.ts
updateAutoDeleteChat.js
updateAutoReply.d.ts
updateAutoReply.js
updateCatalog.d.ts
updateCatalog.js
updateGroupSettings.d.ts
updateGroupSettings.js
updateHiddenConversPin.d.ts
updateHiddenConversPin.js
updateLabels.d.ts
updateLabels.js
updateLang.d.ts
updateLang.js
updateProductCatalog.d.ts
updateProductCatalog.js
updateProfile.d.ts
updateProfile.js
updateProfileBio.d.ts
updateProfileBio.js
updateQuickMessage.d.ts
updateQuickMessage.js
updateSettings.d.ts
updateSettings.js
upgradeGroupToCommunity.d.ts
upgradeGroupToCommunity.js
uploadAttachment.d.ts
uploadAttachment.js
uploadProductPhoto.d.ts
uploadProductPhoto.js
votePoll.d.ts
votePoll.js
```

### B.2 find dist/apis -name '*.d.ts' | sort | xargs cat

#### apis/acceptFriendRequest.d.ts

```typescript
export type AcceptFriendRequestResponse = "";
export declare const acceptFriendRequestFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (friendId: string) => Promise<"">;

```

#### apis/addGroupBlockedMember.d.ts

```typescript
export type AddGroupBlockedMemberResponse = "";
export declare const addGroupBlockedMemberFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (memberId: string | string[], groupId: string) => Promise<"">;

```

#### apis/addGroupDeputy.d.ts

```typescript
export type AddGroupDeputyResponse = "";
export declare const addGroupDeputyFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (memberId: string | string[], groupId: string) => Promise<"">;

```

#### apis/addPollOptions.d.ts

```typescript
import type { PollOptions } from "../models/index.js";
export type AddPollOptionsOption = {
    voted: boolean;
    content: string;
};
export type AddPollOptionsPayload = {
    pollId: number;
    options: AddPollOptionsOption[];
    votedOptionIds: number[];
};
export type AddPollOptionsResponse = {
    options: PollOptions[];
};
export declare const addPollOptionsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: AddPollOptionsPayload) => Promise<AddPollOptionsResponse>;

```

#### apis/addQuickMessage.d.ts

```typescript
import type { QuickMessage, AttachmentSource } from "../models/index.js";
export type AddQuickMessagePayload = {
    keyword: string;
    title: string;
    media?: AttachmentSource;
};
export type AddQuickMessageResponse = {
    item: QuickMessage;
    version: number;
};
export declare const addQuickMessageFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (addPayload: AddQuickMessagePayload) => Promise<AddQuickMessageResponse>;

```

#### apis/addReaction.d.ts

```typescript
import { ThreadType, Reactions } from "../models/index.js";
export type AddReactionResponse = {
    msgIds: number[];
};
export type CustomReaction = {
    rType: number;
    source: number;
    icon: string;
};
export type AddReactionDestination = {
    data: {
        msgId: string;
        cliMsgId: string;
    };
    threadId: string;
    type: ThreadType;
};
export declare const addReactionFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (icon: Reactions | CustomReaction, dest: AddReactionDestination) => Promise<AddReactionResponse>;

```

#### apis/addUnreadMark.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type AddUnreadMarkResponse = {
    data: {
        updateId: number;
    };
    status: number;
};
export declare const addUnreadMarkFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (threadId: string, type?: ThreadType) => Promise<AddUnreadMarkResponse>;

```

#### apis/addUserToGroup.d.ts

```typescript
export type AddUserToGroupResponse = {
    errorMembers: string[];
    error_data: Record<string, string[]>;
};
export declare const addUserToGroupFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (memberId: string | string[], groupId: string) => Promise<AddUserToGroupResponse>;

```

#### apis/blockUser.d.ts

```typescript
export type BlockUserResponse = "";
export declare const blockUserFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (userId: string) => Promise<"">;

```

#### apis/blockViewFeed.d.ts

```typescript
export type BlockViewFeedResponse = "";
export declare const blockViewFeedFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (isBlockFeed: boolean, userId: string) => Promise<"">;

```

#### apis/changeAccountAvatar.d.ts

```typescript
import type { AttachmentSource } from "../models/index.js";
export type ChangeAccountAvatarResponse = "";
export declare const changeAccountAvatarFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (avatarSource: AttachmentSource) => Promise<"">;

```

#### apis/changeFriendAlias.d.ts

```typescript
export type ChangeFriendAliasResponse = "";
export declare const changeFriendAliasFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (alias: string, friendId: string) => Promise<"">;

```

#### apis/changeGroupAvatar.d.ts

```typescript
import type { AttachmentSource } from "../models/index.js";
export type ChangeGroupAvatarResponse = "";
export declare const changeGroupAvatarFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (avatarSource: AttachmentSource, groupId: string) => Promise<"">;

```

#### apis/changeGroupName.d.ts

```typescript
export type ChangeGroupNameResponse = {
    status: number;
};
export declare const changeGroupNameFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (name: string, groupId: string) => Promise<ChangeGroupNameResponse>;

```

#### apis/changeGroupOwner.d.ts

```typescript
export type ChangeGroupOwnerResponse = {
    time: number;
};
export declare const changeGroupOwnerFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (memberId: string, groupId: string) => Promise<ChangeGroupOwnerResponse>;

```

#### apis/createAutoReply.d.ts

```typescript
import type { AutoReplyItem, AutoReplyScope } from "../models/index.js";
export type CreateAutoReplyPayload = {
    content: string;
    isEnable: boolean;
    startTime: number;
    endTime: number;
    scope: AutoReplyScope;
    uids?: string | string[];
};
export type CreateAutoReplyResponse = {
    item: AutoReplyItem;
    version: number;
};
export declare const createAutoReplyFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: CreateAutoReplyPayload) => Promise<CreateAutoReplyResponse>;

```

#### apis/createCatalog.d.ts

```typescript
import type { CatalogItem } from "../models/index.js";
export type CreateCatalogResponse = {
    item: CatalogItem;
    version_ls_catalog: number;
    version_catalog: number;
};
export declare const createCatalogFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (catalogName: string) => Promise<CreateCatalogResponse>;

```

#### apis/createGroup.d.ts

```typescript
import type { AttachmentSource } from "../models/index.js";
export type CreateGroupResponse = {
    groupType: number;
    sucessMembers: string[];
    groupId: string;
    errorMembers: string[];
    error_data: Record<string, unknown>;
};
export type CreateGroupOptions = {
    /**
     * Group name
     */
    name?: string;
    /**
     * List of member IDs to add to the group
     */
    members: string[];
    /**
     * Avatar source, can be a file path or an Attachment object
     */
    avatarSource?: AttachmentSource;
    /**
     * Path to the avatar image file
     * @deprecated Use `avatarSource` instead
     */
    avatarPath?: string;
};
export declare const createGroupFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (options: CreateGroupOptions) => Promise<CreateGroupResponse>;

```

#### apis/createNote.d.ts

```typescript
import type { NoteDetail } from "../models/index.js";
export type CreateNoteOptions = {
    title: string;
    pinAct?: boolean;
};
export type CreateNoteResponse = NoteDetail;
export declare const createNoteFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (options: CreateNoteOptions, groupId: string) => Promise<NoteDetail>;

```

#### apis/createPoll.d.ts

```typescript
import type { PollDetail } from "../models/index.js";
/**
 * Options for creating a poll.
 */
export type CreatePollOptions = {
    /**
     * Question for the poll.
     */
    question: string;
    /**
     * List of options for the poll.
     */
    options: string[];
    /**
     * Poll expiration time in milliseconds (0 = no expiration).
     */
    expiredTime?: number;
    /**
     * Allows multiple choices in the poll.
     */
    allowMultiChoices?: boolean;
    /**
     * Allows members to add new options to the poll.
     */
    allowAddNewOption?: boolean;
    /**
     * Hides voting results until the user has voted.
     */
    hideVotePreview?: boolean;
    /**
     * Hides poll voters (anonymous poll).
     */
    isAnonymous?: boolean;
};
export type CreatePollResponse = PollDetail;
export declare const createPollFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (options: CreatePollOptions, groupId: string) => Promise<PollDetail>;

```

#### apis/createProductCatalog.d.ts

```typescript
import type { AttachmentSource, ProductCatalogItem } from "../models/index.js";
export type CreateProductCatalogPayload = {
    catalogId: string;
    productName: string;
    price: string;
    description: string;
    /**
     * Upto 5 media files are allowed, will be ignored if product_photos is provided
     */
    files?: AttachmentSource[];
    /**
     * List of product photo URLs, upto 5
     *
     * You can manually get the URL using `uploadProductPhoto` api
     */
    product_photos?: string[];
};
export type CreateProductCatalogResponse = {
    item: ProductCatalogItem;
    version_ls_catalog: number;
    version_catalog: number;
};
export declare const createProductCatalogFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: CreateProductCatalogPayload) => Promise<CreateProductCatalogResponse>;

```

#### apis/createReminder.d.ts

```typescript
import type { ReminderGroup, ReminderUser } from "../models/index.js";
import { ReminderRepeatMode, ThreadType } from "../models/index.js";
export type CreateReminderOptions = {
    title: string;
    emoji?: string;
    startTime?: number;
    repeat?: ReminderRepeatMode;
};
export type CreateReminderUser = ReminderUser;
export type CreateReminderGroup = Omit<ReminderGroup, "responseMem">;
export type CreateReminderResponse = CreateReminderUser | CreateReminderGroup;
export declare const createReminderFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (options: CreateReminderOptions, threadId: string, type?: ThreadType) => Promise<CreateReminderResponse>;

```

#### apis/custom.d.ts

```typescript
import { type ContextSession } from "../context.js";
import { type FactoryUtils } from "../utils.js";
export type CustomAPIProps<T, K> = {
    ctx: ContextSession;
    utils: FactoryUtils<T>;
    props: K;
};
export type CustomAPICallback<T, K> = (props: CustomAPIProps<T, K>) => T | Promise<T>;
export declare const customFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => <T, K = any>(name: string, callback: CustomAPICallback<T, K>) => void;

```

#### apis/deleteAutoReply.d.ts

```typescript
export type DeleteAutoReplyResponse = {
    item: number;
    version: number;
};
export declare const deleteAutoReplyFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (id: number) => Promise<DeleteAutoReplyResponse>;

```

#### apis/deleteAvatar.d.ts

```typescript
export type DeleteAvatarResponse = {
    delPhotoIds: string[];
    errMap: {
        [key: string]: {
            err: number;
        };
    };
};
export declare const deleteAvatarFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (photoId: string | string[]) => Promise<DeleteAvatarResponse>;

```

#### apis/deleteCatalog.d.ts

```typescript
export type DeleteCatalogResponse = "";
export declare const deleteCatalogFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (catalogId: string) => Promise<"">;

```

#### apis/deleteChat.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type DeleteChatResponse = {
    status: number;
};
export type DeleteChatLastMessage = {
    /**
     * Last message owner ID to delete backwards
     */
    ownerId: string;
    /**
     * Last message client ID to delete backwards
     */
    cliMsgId: string;
    /**
     * Last message global ID to delete backwards
     */
    globalMsgId: string;
};
export declare const deleteChatFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (lastMessage: DeleteChatLastMessage, threadId: string, type?: ThreadType) => Promise<DeleteChatResponse>;

```

#### apis/deleteGroupInviteBox.d.ts

```typescript
export type DeleteGroupInviteBoxResponse = {
    delInvitaionIds: string[];
    errMap: {
        [groupId: string]: {
            err: number;
        };
    };
};
export declare const deleteGroupInviteBoxFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (groupId: string | string[], blockFutureInvite?: boolean) => Promise<DeleteGroupInviteBoxResponse>;

```

#### apis/deleteMessage.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type DeleteMessageResponse = {
    status: number;
};
export type DeleteMessageDestination = {
    data: {
        cliMsgId: string;
        msgId: string;
        uidFrom: string;
    };
    threadId: string;
    type?: ThreadType;
};
export declare const deleteMessageFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (dest: DeleteMessageDestination, onlyMe?: boolean) => Promise<DeleteMessageResponse>;

```

#### apis/deleteProductCatalog.d.ts

```typescript
export type DeleteProductCatalogPayload = {
    productIds: string | string[];
    catalogId: string;
};
export type DeleteProductCatalogResponse = {
    item: number[];
    version_ls_catalog: number;
    version_catalog: number;
};
export declare const deleteProductCatalogFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: DeleteProductCatalogPayload) => Promise<DeleteProductCatalogResponse>;

```

#### apis/disableGroupLink.d.ts

```typescript
export type DisableGroupLinkResponse = "";
export declare const disableGroupLinkFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (groupId: string) => Promise<"">;

```

#### apis/disperseGroup.d.ts

```typescript
export type DisperseGroupResponse = "";
export declare const disperseGroupFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (groupId: string) => Promise<"">;

```

#### apis/editNote.d.ts

```typescript
import type { NoteDetail } from "../models/index.js";
export type EditNoteOptions = {
    /**
     * New note title
     */
    title: string;
    /**
     * Topic ID to edit note from
     */
    topicId: string;
    /**
     * Should the note be pinned?
     */
    pinAct?: boolean;
};
export type EditNoteResponse = NoteDetail;
export declare const editNoteFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (options: EditNoteOptions, groupId: string) => Promise<NoteDetail>;

```

#### apis/editReminder.d.ts

```typescript
import type { ReminderRepeatMode, ReminderGroup, ReminderUser } from "../models/index.js";
import { ThreadType } from "../models/index.js";
export type EditReminderOptions = {
    title: string;
    topicId: string;
    emoji?: string;
    startTime?: number;
    repeat?: ReminderRepeatMode;
};
export type EditReminderUser = ReminderUser;
export type EditReminderGroup = Omit<ReminderGroup, "responseMem">;
export type EditReminderResponse = EditReminderUser | EditReminderGroup;
export declare const editReminderFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (options: EditReminderOptions, threadId: string, type?: ThreadType) => Promise<EditReminderResponse>;

```

#### apis/enableGroupLink.d.ts

```typescript
export type EnableGroupLinkResponse = {
    link: string;
    expiration_date: number;
    enabled: number;
};
export declare const enableGroupLinkFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (groupId: string) => Promise<EnableGroupLinkResponse>;

```

#### apis/fetchAccountInfo.d.ts

```typescript
import type { User } from "../models/index.js";
export type FetchAccountInfoResponse = {
    profile: User;
};
export declare const fetchAccountInfoFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<FetchAccountInfoResponse>;

```

#### apis/findUser.d.ts

```typescript
import { AvatarSize, type UserBasic } from "../models/index.js";
export type FindUserResponse = UserBasic;
export declare const findUserFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (phoneNumber: string, avatarSize?: AvatarSize) => Promise<UserBasic>;

```

#### apis/findUserByUsername.d.ts

```typescript
import { AvatarSize, type UserBasic } from "../models/index.js";
export type FindUserByUsernameResponse = UserBasic;
export declare const findUserByUsernameFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (username: string, avatarSize?: AvatarSize) => Promise<UserBasic>;

```

#### apis/forwardMessage.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type ForwardMessagePayload = {
    message: string;
    ttl?: number;
    reference?: {
        id: string;
        ts: number;
        logSrcType: number;
        fwLvl: number;
    };
};
export type ForwardMessageSuccess = {
    clientId: string;
    msgId: string;
};
export type ForwardMessageFail = {
    clientId: string;
    error_code: string;
};
export type ForwardMessageResponse = {
    success: ForwardMessageSuccess[];
    fail: ForwardMessageFail[];
};
export declare const forwardMessageFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: ForwardMessagePayload, threadIds: string[], type?: ThreadType) => Promise<ForwardMessageResponse>;

```

#### apis/getAliasList.d.ts

```typescript
export type GetAliasListResponse = {
    items: {
        userId: string;
        alias: string;
    }[];
    updateTime: string;
};
export declare const getAliasListFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (count?: number, page?: number) => Promise<GetAliasListResponse>;

```

#### apis/getAllFriends.d.ts

```typescript
import { AvatarSize, type User } from "../models/index.js";
export type GetAllFriendsResponse = User[];
export declare const getAllFriendsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (count?: number, page?: number, avatarSize?: AvatarSize) => Promise<GetAllFriendsResponse>;

```

#### apis/getAllGroups.d.ts

```typescript
export type GetAllGroupsResponse = {
    version: string;
    gridVerMap: {
        [groupId: string]: string;
    };
};
export declare const getAllGroupsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<GetAllGroupsResponse>;

```

#### apis/getArchivedChatList.d.ts

```typescript
export type GetArchivedChatListResponse = {
    items: unknown[];
    version: number;
};
export declare const getArchivedChatListFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<GetArchivedChatListResponse>;

```

#### apis/getAutoDeleteChat.d.ts

```typescript
export type GetAutoDeleteChatResponse = {
    convers: {
        destId: string;
        isGroup: boolean;
        ttl: number;
        createdAt: number;
    }[];
};
export declare const getAutoDeleteChatFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<GetAutoDeleteChatResponse>;

```

#### apis/getAutoReplyList.d.ts

```typescript
import type { AutoReplyItem } from "../models/index.js";
export type GetAutoReplyListResponse = {
    item: AutoReplyItem[];
    version: number;
};
export declare const getAutoReplyListFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<GetAutoReplyListResponse>;

```

#### apis/getAvatarList.d.ts

```typescript
export type GetAvatarListResponse = {
    albumId: string;
    nextPhotoId: string;
    hasMore: number;
    photos: {
        photoId: string;
        thumbnail: string;
        url: string;
        bkUrl: string;
    }[];
};
export declare const getAvatarListFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (count?: number, page?: number) => Promise<GetAvatarListResponse>;

```

#### apis/getAvatarUrlProfile.d.ts

```typescript
import { AvatarSize } from "../models/index.js";
export type GetAvatarUrlProfileResponse = {
    [userId: string]: {
        avatar: string;
    };
};
export declare const getAvatarUrlProfileFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (friendIds: string | string[], avatarSize?: AvatarSize) => Promise<GetAvatarUrlProfileResponse>;

```

#### apis/getBizAccount.d.ts

```typescript
import type { BusinessCategory } from "../models/index.js";
export type GetBizAccountResponse = {
    biz?: {
        desc: string | null;
        cate: BusinessCategory;
        addr: string;
        website: string;
        email: string;
    };
    setting_start_page?: {
        enable_biz_label: number;
        enable_cate: number;
        enable_add: number;
        cta_profile: number;
        /**
         * Relative path used to build the catalog URL.
         *
         * Example: https://catalog.zalo.me/${cta_catalog}
         */
        cta_catalog: string | null;
    } | null;
    pkgId: number;
};
export declare const getBizAccountFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (friendId: string) => Promise<GetBizAccountResponse>;

```

#### apis/getCatalogList.d.ts

```typescript
import type { CatalogItem } from "../models/index.js";
export type GetCatalogListPayload = {
    /**
     * Number of items to retrieve (default: 20)
     */
    limit?: number;
    lastProductId?: number;
    /**
     * Page number (default: 0)
     */
    page?: number;
};
export type GetCatalogListResponse = {
    items: CatalogItem[];
    version: number;
    has_more: number;
};
export declare const getCatalogListFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload?: GetCatalogListPayload) => Promise<GetCatalogListResponse>;

```

#### apis/getCloseFriends.d.ts

```typescript
import type { User } from "../models/index.js";
export type GetCloseFriendsResponse = User[];
export declare const getCloseFriendsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<GetCloseFriendsResponse>;

```

#### apis/getContext.d.ts

```typescript
export declare const getContextFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => import("../context.js").ContextSession;

```

#### apis/getCookie.d.ts

```typescript
export declare const getCookieFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => import("tough-cookie").CookieJar;

```

#### apis/getFriendBoardList.d.ts

```typescript
export type GetFriendBoardListResponse = {
    data: string[];
    version: number;
};
export declare const getFriendBoardListFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (conversationId: string) => Promise<GetFriendBoardListResponse>;

```

#### apis/getFriendOnlines.d.ts

```typescript
export type GetFriendOnlinesStatus = {
    userId: string;
    status: string;
};
export type GetFriendOnlinesResponse = {
    predefine: string[];
    ownerStatus: string;
    onlines: GetFriendOnlinesStatus[];
};
export declare const getFriendOnlinesFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<GetFriendOnlinesResponse>;

```

#### apis/getFriendRecommendations.d.ts

```typescript
import type { Gender, ZBusinessPackage } from "../models/index.js";
export declare enum FriendRecommendationsType {
    RecommendedFriend = 1,
    ReceivedFriendRequest = 2
}
export type FriendRecommendationsCollapseMsgListConfig = {
    collapseId: number;
    collapseXItem: number;
    collapseYItem: number;
};
export type FriendRecommendationsDataInfo = {
    userId: string;
    zaloName: string;
    displayName: string;
    avatar: string;
    phoneNumber: string;
    status: string;
    gender: Gender;
    dob: number;
    type: number;
    recommType: FriendRecommendationsType;
    recommSrc: number;
    recommTime: number;
    recommInfo: {
        suggestWay: number;
        source: number;
        message: string;
        customText: string | null;
    };
    bizPkg: ZBusinessPackage;
    isSeenFriendReq: boolean;
};
export type FriendRecommendationsRecommItem = {
    recommItemType: number;
    dataInfo: FriendRecommendationsDataInfo;
};
export type GetFriendRecommendationsResponse = {
    expiredDuration: number;
    collapseMsgListConfig: FriendRecommendationsCollapseMsgListConfig;
    recommItems: FriendRecommendationsRecommItem[];
};
export declare const getFriendRecommendationsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<GetFriendRecommendationsResponse>;

```

#### apis/getFriendRequestStatus.d.ts

```typescript
export type GetFriendRequestStatusResponse = {
    addFriendPrivacy: number;
    isSeenFriendReq: boolean;
    is_friend: number;
    is_requested: number;
    is_requesting: number;
};
export declare const getFriendRequestStatusFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (friendId: string) => Promise<GetFriendRequestStatusResponse>;

```

#### apis/getFullAvatar.d.ts

```typescript
export type GetFullAvatarResponse = {
    bk_full_avatar: string;
    full_avatar: string;
};
export declare const getFullAvatarFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (friendId: string) => Promise<GetFullAvatarResponse>;

```

#### apis/getGroupBlockedMember.d.ts

```typescript
export type GetGroupBlockedMemberPayload = {
    /**
     * Page number (default: 1)
     */
    page?: number;
    /**
     * Number of items to retrieve (default: 50)
     */
    count?: number;
};
export type GetGroupBlockedMemberResponse = {
    blocked_members: {
        id: string;
        dName: string;
        zaloName: string;
        avatar: string;
        avatar_25: string;
        accountStatus: number;
        type: number;
    }[];
    has_more: number;
};
export declare const getGroupBlockedMemberFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: GetGroupBlockedMemberPayload, groupId: string) => Promise<GetGroupBlockedMemberResponse>;

```

#### apis/getGroupChatHistory.d.ts

```typescript
import { GroupMessage } from "../models/index.js";
export type GetGroupChatHistoryResponse = {
    lastActionId: string;
    lastActionIdOther: string;
    more: number;
    groupMsgs: GroupMessage[];
};
export declare const getGroupChatHistoryFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (groupId: string, count?: number) => Promise<GetGroupChatHistoryResponse>;

```

#### apis/getGroupInfo.d.ts

```typescript
import type { GroupInfo } from "../models/index.js";
export type GroupInfoResponse = {
    removedsGroup: string[];
    unchangedsGroup: string[];
    gridInfoMap: {
        [groupId: string]: GroupInfo & {
            memVerList: string[];
            pendingApprove: GroupInfoPendingApprove;
        };
    };
};
export type GroupInfoPendingApprove = {
    time: number;
    uids: string[] | null;
};
export declare const getGroupInfoFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (groupId: string | string[]) => Promise<GroupInfoResponse>;

```

#### apis/getGroupInviteBoxInfo.d.ts

```typescript
import type { GroupInfo, GroupTopic } from "../models/index.js";
export type GetGroupInviteBoxInfoPayload = {
    groupId: string;
    mpage?: number;
    mcount?: number;
};
export type GetGroupInviteBoxInfoResponse = {
    groupInfo: GroupInfo & {
        topic?: Omit<GroupTopic, "action">;
    };
    inviterInfo: {
        id: string;
        dName: string;
        zaloName: string;
        avatar: string;
        avatar_25: string;
        accountStatus: number;
        type: number;
    };
    grCreatorInfo: {
        id: string;
        dName: string;
        zaloName: string;
        avatar: string;
        avatar_25: string;
        accountStatus: number;
        type: number;
    };
    expiredTs: string;
    type: number;
};
export declare const getGroupInviteBoxInfoFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: GetGroupInviteBoxInfoPayload) => Promise<GetGroupInviteBoxInfoResponse>;

```

#### apis/getGroupInviteBoxList.d.ts

```typescript
import type { GroupInfo } from "../models/index.js";
export type GetGroupInviteBoxListPayload = {
    mpage?: number;
    page?: number;
    invPerPage?: number;
    mcount?: number;
};
export type GetGroupInviteBoxListResponse = {
    invitations: {
        groupInfo: GroupInfo;
        inviterInfo: {
            id: string;
            dName: string;
            zaloName: string;
            avatar: string;
            avatar_25: string;
            accountStatus: number;
            type: number;
        };
        grCreatorInfo: {
            id: string;
            dName: string;
            zaloName: string;
            avatar: string;
            avatar_25: string;
            accountStatus: number;
            type: number;
        };
        /**
         * Expired timestamp max 7 days
         */
        expiredTs: string;
        type: number;
    }[];
    total: number;
    hasMore: boolean;
};
export declare const getGroupInviteBoxListFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload?: GetGroupInviteBoxListPayload) => Promise<GetGroupInviteBoxListResponse>;

```

#### apis/getGroupLinkDetail.d.ts

```typescript
export type GetGroupLinkDetailResponse = {
    link?: string;
    expiration_date?: number;
    /**
     * 1: enabled, 0: disabled
     */
    enabled: number;
};
export declare const getGroupLinkDetailFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (groupId: string) => Promise<GetGroupLinkDetailResponse>;

```

#### apis/getGroupLinkInfo.d.ts

```typescript
import type { GroupSetting } from "../models/index.js";
export type GetGroupLinkInfoPayload = {
    link: string;
    /**
     * Default: 1
     */
    memberPage?: number;
};
export type GetGroupLinkInfoResponse = {
    groupId: string;
    name: string;
    desc: string;
    type: number;
    creatorId: string;
    avt: string;
    fullAvt: string;
    adminIds: string[];
    currentMems: {
        id: string;
        dName: string;
        zaloName: string;
        avatar: string;
        avatar_25: string;
        accountStatus: number;
        type: number;
    }[];
    admins: unknown[];
    hasMoreMember: number;
    subType: number;
    totalMember: number;
    setting: GroupSetting;
    globalId: string;
};
export declare const getGroupLinkInfoFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: GetGroupLinkInfoPayload) => Promise<GetGroupLinkInfoResponse>;

```

#### apis/getGroupMembersInfo.d.ts

```typescript
export type GroupMemberProfile = {
    displayName: string;
    zaloName: string;
    avatar: string;
    accountStatus: number;
    type: number;
    lastUpdateTime: number;
    globalId: string;
    id: string;
};
export type GetGroupMembersInfoResponse = {
    profiles: {
        [memberId: string]: GroupMemberProfile;
    };
    unchangeds_profile: unknown[];
};
export declare const getGroupMembersInfoFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (memberId: string | string[]) => Promise<GetGroupMembersInfoResponse>;

```

#### apis/getHiddenConversations.d.ts

```typescript
export type GetHiddenConversationsResponse = {
    pin: string;
    threads: {
        /**
         * 1: true, 0: false
         */
        is_group: number;
        thread_id: string;
    }[];
};
export declare const getHiddenConversationsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<GetHiddenConversationsResponse>;

```

#### apis/getLabels.d.ts

```typescript
import type { LabelData } from "../models/index.js";
export type GetLabelsResponse = {
    labelData: LabelData[];
    version: number;
    lastUpdateTime: number;
};
export declare const getLabelsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<GetLabelsResponse>;

```

#### apis/getListBoard.d.ts

```typescript
import type { NoteDetail, PinnedMessageDetail, PollDetail } from "../models/index.js";
import { BoardType } from "../models/index.js";
export type ListBoardOptions = {
    /**
     * Page number (default: 1)
     */
    page?: number;
    /**
     * Number of items to retrieve (default: 20)
     */
    count?: number;
};
export type BoardItem = {
    boardType: BoardType;
    data: PollDetail | NoteDetail | PinnedMessageDetail;
};
export type GetListBoardResponse = {
    items: BoardItem[];
    count: number;
};
export declare const getListBoardFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (options: ListBoardOptions, groupId: string) => Promise<GetListBoardResponse>;

```

#### apis/getListReminder.d.ts

```typescript
import type { ReminderGroup, ReminderUser } from "../models/index.js";
import { ThreadType } from "../models/index.js";
export type ListReminderOptions = {
    /**
     * Page number (default: 1)
     */
    page?: number;
    /**
     * Number of items to retrieve (default: 20)
     */
    count?: number;
};
export type ReminderListUser = ReminderUser;
export type ReminderListGroup = ReminderGroup & {
    groupId: string;
    eventType: number;
    responseMem: {
        rejectMember: number;
        myResp: number;
        acceptMember: number;
    };
    repeatInfo: {
        list_ts: unknown[];
    };
    repeatData: unknown[];
};
export type GetListReminderResponse = (ReminderListUser & ReminderListGroup)[];
export declare const getListReminderFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (options: ListReminderOptions, threadId: string, type?: ThreadType) => Promise<GetListReminderResponse>;

```

#### apis/getMultiUsersByPhones.d.ts

```typescript
import { AvatarSize, type UserBasic } from "../models/index.js";
export type GetMultiUsersByPhonesResponse = {
    [phoneNumber: string]: UserBasic;
};
export declare const getMultiUsersByPhonesFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (phoneNumbers: string | string[], avatarSize?: AvatarSize) => Promise<GetMultiUsersByPhonesResponse>;

```

#### apis/getMute.d.ts

```typescript
export type MuteEntriesInfo = {
    id: string;
    duration: number;
    startTime: number;
    systemTime: number;
    currentTime: number;
    muteMode: number;
};
export type GetMuteResponse = {
    chatEntries: MuteEntriesInfo[];
    groupChatEntries: MuteEntriesInfo[];
};
export declare const getMuteFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<GetMuteResponse>;

```

#### apis/getOwnId.d.ts

```typescript
export declare const getOwnIdFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => string;

```

#### apis/getPendingGroupMembers.d.ts

```typescript
export type GetPendingGroupMembersUserInfo = {
    uid: string;
    dpn: string;
    avatar: string;
    user_submit: null;
};
export type GetPendingGroupMembersResponse = {
    time: number;
    users: GetPendingGroupMembersUserInfo[];
};
export declare const getPendingGroupMembersFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (groupId: string) => Promise<GetPendingGroupMembersResponse>;

```

#### apis/getPinConversations.d.ts

```typescript
export type GetPinConversationsResponse = {
    conversations: string[];
    version: number;
};
export declare const getPinConversationsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<GetPinConversationsResponse>;

```

#### apis/getPollDetail.d.ts

```typescript
import type { PollDetail } from "../models/index.js";
export type PollDetailResponse = PollDetail;
export declare const getPollDetailFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (pollId: number) => Promise<PollDetail>;

```

#### apis/getProductCatalogList.d.ts

```typescript
import type { ProductCatalogItem } from "../models/index.js";
export type GetProductCatalogListPayload = {
    catalogId: string;
    /**
     * Number of items to retrieve (default: 100)
     */
    limit?: number;
    versionCatalog?: number;
    lastProductId?: string;
    /**
     * Page number (default: 0)
     */
    page?: number;
};
export type GetProductCatalogListResponse = {
    items: ProductCatalogItem[];
    version: number;
    has_more: number;
};
export declare const getProductCatalogListFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: GetProductCatalogListPayload) => Promise<GetProductCatalogListResponse>;

```

#### apis/getQR.d.ts

```typescript
export type GetQRResponse = {
    [userId: string]: string;
};
export declare const getQRFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (userId: string | string[]) => Promise<GetQRResponse>;

```

#### apis/getQuickMessageList.d.ts

```typescript
import type { QuickMessage } from "../models/index.js";
export type GetQuickMessageListResponse = {
    cursor: number;
    version: number;
    items: QuickMessage[];
};
export declare const getQuickMessageListFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<GetQuickMessageListResponse>;

```

#### apis/getRelatedFriendGroup.d.ts

```typescript
export type GetRelatedFriendGroupResponse = {
    groupRelateds: {
        [friendId: string]: string[];
    };
};
export declare const getRelatedFriendGroupFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (friendId: string | string[]) => Promise<GetRelatedFriendGroupResponse>;

```

#### apis/getReminder.d.ts

```typescript
import type { ReminderGroup } from "../models/index.js";
export type GetReminderResponse = ReminderGroup;
export declare const getReminderFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (reminderId: string) => Promise<ReminderGroup>;

```

#### apis/getReminderResponses.d.ts

```typescript
export type GetReminderResponsesResponse = {
    rejectMember: string[];
    acceptMember: string[];
};
export declare const getReminderResponsesFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (reminderId: string) => Promise<GetReminderResponsesResponse>;

```

#### apis/getSentFriendRequest.d.ts

```typescript
import type { ZBusinessPackage } from "../models/ZBusiness.js";
export type SentFriendRequestInfo = {
    userId: string;
    zaloName: string;
    displayName: string;
    avatar: string;
    globalId: string;
    bizPkg: ZBusinessPackage;
    fReqInfo: {
        message: string;
        src: number;
        time: number;
    };
};
export type GetSentFriendRequestResponse = {
    [userId: string]: SentFriendRequestInfo;
};
export declare const getSentFriendRequestFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<GetSentFriendRequestResponse>;

```

#### apis/getSettings.d.ts

```typescript
import type { UserSetting } from "../models/index.js";
export type GetSettingsResponse = UserSetting;
export declare const getSettingsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<UserSetting>;

```

#### apis/getStickerCategoryDetail.d.ts

```typescript
import type { StickerDetail } from "../models/index.js";
export type GetStickerCategoryDetailResponse = StickerDetail[];
export declare const getStickerCategoryDetailFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (cateId: number) => Promise<GetStickerCategoryDetailResponse>;

```

#### apis/getStickers.d.ts

```typescript
export declare const getStickersFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (keyword: string) => Promise<number[]>;

```

#### apis/getStickersDetail.d.ts

```typescript
import type { StickerDetail } from "../models/index.js";
export type StickerDetailResponse = StickerDetail[];
export declare const getStickersDetailFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (stickerIds: number | number[]) => Promise<StickerDetailResponse>;

```

#### apis/getUnreadMark.d.ts

```typescript
export type UnreadMark = {
    id: number;
    cliMsgId: number;
    fromUid: number;
    ts: number;
};
export type GetUnreadMarkResponse = {
    data: {
        convsGroup: UnreadMark[];
        convsUser: UnreadMark[];
    };
    status: number;
};
export declare const getUnreadMarkFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<GetUnreadMarkResponse>;

```

#### apis/getUserInfo.d.ts

```typescript
import { AvatarSize, type User } from "../models/index.js";
export type ProfileInfo = User;
export type UserInfoResponse = {
    unchanged_profiles: Record<string, unknown>;
    phonebook_version: number;
    changed_profiles: Record<string, ProfileInfo>;
};
export declare const getUserInfoFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (userId: string | string[], avatarSize?: AvatarSize) => Promise<UserInfoResponse>;

```

#### apis/inviteUserToGroups.d.ts

```typescript
export type InviteUserToGroupsResponse = {
    grid_message_map: {
        [groupId: string]: {
            error_code: number;
            error_message: string;
            data: string | null;
        };
    };
};
export declare const inviteUserToGroupsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (userId: string, groupId: string | string[]) => Promise<InviteUserToGroupsResponse>;

```

#### apis/joinGroupInviteBox.d.ts

```typescript
export type JoinGroupInviteBoxResponse = "";
export declare const joinGroupInviteBoxFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (groupId: string) => Promise<"">;

```

#### apis/joinGroupLink.d.ts

```typescript
export type JoinGroupLinkResponse = "";
export declare const joinGroupLinkFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (link: string) => Promise<"">;

```

#### apis/keepAlive.d.ts

```typescript
export type KeepAliveResponse = {
    config_vesion: number;
};
export declare const keepAliveFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<KeepAliveResponse>;

```

#### apis/lastOnline.d.ts

```typescript
export type LastOnlineResponse = {
    settings: {
        show_online_status: boolean;
    };
    lastOnline: number;
};
export declare const lastOnlineFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (uid: string) => Promise<LastOnlineResponse>;

```

#### apis/leaveGroup.d.ts

```typescript
export type LeaveGroupResponse = {
    memberError: unknown[];
};
export declare const leaveGroupFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (groupId: string, silent?: boolean) => Promise<LeaveGroupResponse>;

```

#### apis/listen.d.ts

```typescript
import EventEmitter from "events";
import { type FriendEvent } from "../models/FriendEvent.js";
import { type GroupEvent } from "../models/GroupEvent.js";
import type { Message, Typing } from "../models/index.js";
import { Reaction, Undo, ThreadType } from "../models/index.js";
import type { ContextSession } from "../context.js";
import { type SeenMessage } from "../models/SeenMessage.js";
import { type DeliveredMessage } from "../models/DeliveredMessage.js";
type UploadEventData = {
    fileUrl: string;
    fileId: string;
};
export type WsPayload<T = Record<string, unknown>> = {
    version: number;
    cmd: number;
    subCmd: number;
    data: T;
};
export type OnMessageCallback = (message: Message) => unknown;
export type OnClosedCallback = (code: CloseReason, reason: string) => unknown;
export type OnErrorCallback = (error: unknown) => unknown;
export declare enum CloseReason {
    ManualClosure = 1000,
    AbnormalClosure = 1006,
    DuplicateConnection = 3000,
    KickConnection = 3003
}
interface ListenerEvents {
    connected: [];
    disconnected: [code: CloseReason, reason: string];
    closed: [code: CloseReason, reason: string];
    error: [error: unknown];
    typing: [typing: Typing];
    message: [message: Message];
    old_messages: [messages: Message[], type: ThreadType];
    seen_messages: [messages: SeenMessage[]];
    delivered_messages: [messages: DeliveredMessage[]];
    reaction: [reaction: Reaction];
    old_reactions: [reactions: Reaction[], isGroup: boolean];
    upload_attachment: [data: UploadEventData];
    undo: [data: Undo];
    friend_event: [data: FriendEvent];
    group_event: [data: GroupEvent];
    cipher_key: [key: string];
}
export declare class Listener extends EventEmitter<ListenerEvents> {
    private ctx;
    private urls;
    private wsURL;
    private cookie;
    private userAgent;
    private ws;
    private retryCount;
    private rotateCount;
    private onConnectedCallback;
    private onClosedCallback;
    private onErrorCallback;
    private onMessageCallback;
    private cipherKey?;
    private selfListen;
    private pingInterval?;
    private id;
    constructor(ctx: ContextSession, urls: string[]);
    /**
     * @deprecated Use `on` method instead
     */
    onConnected(cb: () => unknown): void;
    /**
     * @deprecated Use `on` method instead
     */
    onClosed(cb: OnClosedCallback): void;
    /**
     * @deprecated Use `on` method instead
     */
    onError(cb: OnErrorCallback): void;
    /**
     * @deprecated Use `on` method instead
     */
    onMessage(cb: OnMessageCallback): void;
    private canRetry;
    private shouldRotate;
    private rotateEndpoint;
    start({ retryOnClose }?: {
        retryOnClose?: boolean;
    }): void;
    stop(): void;
    sendWs(payload: WsPayload, requireId?: boolean): void;
    /**
     * Request old messages
     *
     * @param lastMsgId
     */
    requestOldMessages(threadType: ThreadType, lastMsgId?: string | null): void;
    /**
     * Request old messages
     *
     * @param lastMsgId
     */
    requestOldReactions(threadType: ThreadType, lastMsgId?: string | null): void;
    private reset;
}
export {};

```

#### apis/lockPoll.d.ts

```typescript
export type LockPollResponse = "";
export declare const lockPollFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (pollId: number) => Promise<"">;

```

#### apis/login.d.ts

```typescript
import type { ContextBase } from "../context.js";
export declare function login(ctx: ContextBase, encryptParams: boolean): Promise<Record<string, unknown> | null>;
export declare function getServerInfo(ctx: ContextBase, encryptParams: boolean): Promise<any>;

```

#### apis/loginQR.d.ts

```typescript
import { type SerializedCookie, type SerializedCookieJar } from "tough-cookie";
import type { ContextBase } from "../context.js";
export declare enum LoginQRCallbackEventType {
    QRCodeGenerated = 0,
    QRCodeExpired = 1,
    QRCodeScanned = 2,
    QRCodeDeclined = 3,
    GotLoginInfo = 4
}
export type LoginQRCallbackEvent = {
    type: LoginQRCallbackEventType.QRCodeGenerated;
    data: {
        code: string;
        image: string;
        options: {
            enabledCheckOCR: boolean;
            enabledMultiLayer: boolean;
        };
        token: string;
    };
    actions: {
        saveToFile: (qrPath?: string) => Promise<unknown>;
        retry: () => unknown;
        abort: () => unknown;
    };
} | {
    type: LoginQRCallbackEventType.QRCodeExpired;
    data: null;
    actions: {
        retry: () => unknown;
        abort: () => unknown;
    };
} | {
    type: LoginQRCallbackEventType.QRCodeScanned;
    data: {
        avatar: string;
        display_name: string;
    };
    actions: {
        retry: () => unknown;
        abort: () => unknown;
    };
} | {
    type: LoginQRCallbackEventType.QRCodeDeclined;
    data: {
        code: string;
    };
    actions: {
        retry: () => unknown;
        abort: () => unknown;
    };
} | {
    type: LoginQRCallbackEventType.GotLoginInfo;
    data: {
        cookie: SerializedCookie[];
        imei: string;
        userAgent: string;
    };
    actions: null;
};
export type LoginQRCallback = (event: LoginQRCallbackEvent) => unknown;
export declare function loginQR(ctx: ContextBase, options: {
    userAgent: string;
    qrPath?: string;
}, callback?: LoginQRCallback): Promise<{
    userInfo: {
        name: string;
        avatar: string;
    };
    cookies: SerializedCookieJar["cookies"];
} | null>;

```

#### apis/parseLink.d.ts

```typescript
export type ParseLinkErrorMaps = Record<string, number>;
export type ParseLinkResponse = {
    data: {
        thumb: string;
        title: string;
        desc: string;
        src: string;
        href: string;
        media: {
            type: number;
            count: number;
            mediaTitle: string;
            artist: string;
            streamUrl: string;
            stream_icon: string;
        };
        stream_icon: string;
    };
    error_maps: ParseLinkErrorMaps;
};
export declare const parseLinkFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (link: string) => Promise<ParseLinkResponse>;

```

#### apis/rejectFriendRequest.d.ts

```typescript
export type RejectFriendRequestResponse = "";
export declare const rejectFriendRequestFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (friendId: string) => Promise<"">;

```

#### apis/removeFriend.d.ts

```typescript
export type RemoveFriendResponse = "";
export declare const removeFriendFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (friendId: string) => Promise<"">;

```

#### apis/removeFriendAlias.d.ts

```typescript
export type RemoveFriendAliasResponse = "";
export declare const removeFriendAliasFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (friendId: string) => Promise<"">;

```

#### apis/removeGroupBlockedMember.d.ts

```typescript
export type RemoveGroupBlockedMemberResponse = "";
export declare const removeGroupBlockedMemberFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (memberId: string | string[], groupId: string) => Promise<"">;

```

#### apis/removeGroupDeputy.d.ts

```typescript
export type RemoveGroupDeputyResponse = "";
export declare const removeGroupDeputyFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (memberId: string | string[], groupId: string) => Promise<"">;

```

#### apis/removeQuickMessage.d.ts

```typescript
export type RemoveQuickMessageResponse = {
    itemIds: number[];
    version: number;
};
export declare const removeQuickMessageFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (itemIds: number | number[]) => Promise<RemoveQuickMessageResponse>;

```

#### apis/removeReminder.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type RemoveReminderResponse = "" | number;
export declare const removeReminderFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (reminderId: string, threadId: string, type?: ThreadType) => Promise<RemoveReminderResponse>;

```

#### apis/removeUnreadMark.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type RemoveUnreadMarkResponse = {
    data: {
        updateId: number;
    };
    status: number;
};
export declare const removeUnreadMarkFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (threadId: string, type?: ThreadType) => Promise<RemoveUnreadMarkResponse>;

```

#### apis/removeUserFromGroup.d.ts

```typescript
export type RemoveUserFromGroupResponse = {
    errorMembers: string[];
};
export declare const removeUserFromGroupFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (memberId: string | string[], groupId: string) => Promise<RemoveUserFromGroupResponse>;

```

#### apis/resetHiddenConversPin.d.ts

```typescript
export type ResetHiddenConversPinResponse = "";
export declare const resetHiddenConversPinFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => () => Promise<"">;

```

#### apis/reuseAvatar.d.ts

```typescript
export type ReuseAvatarResponse = null;
export declare const reuseAvatarFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (photoId: string) => Promise<null>;

```

#### apis/reviewPendingMemberRequest.d.ts

```typescript
export type ReviewPendingMemberRequestPayload = {
    members: string | string[];
    isApprove: boolean;
};
export declare enum ReviewPendingMemberRequestStatus {
    SUCCESS = 0,
    NOT_IN_PENDING_LIST = 170,
    ALREADY_IN_GROUP = 178,
    INSUFFICIENT_PERMISSION = 166
}
export type ReviewPendingMemberRequestResponse = {
    [memberId: string]: ReviewPendingMemberRequestStatus;
};
export declare const reviewPendingMemberRequestFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: ReviewPendingMemberRequestPayload, groupId: string) => Promise<ReviewPendingMemberRequestResponse>;

```

#### apis/searchSticker.d.ts

```typescript
import type { StickerBasic } from "../models/index.js";
export type SearchStickerResponse = StickerBasic[];
export declare const searchStickerFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (keyword: string, limit?: number) => Promise<SearchStickerResponse>;

```

#### apis/sendBankCard.d.ts

```typescript
import type { BinBankCard } from "../models/index.js";
import { ThreadType } from "../models/index.js";
export type SendBankCardPayload = {
    binBank: BinBankCard;
    numAccBank: string;
    nameAccBank?: string;
};
export type SendBankCardResponse = "";
export declare const sendBankCardFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: SendBankCardPayload, threadId: string, type?: ThreadType) => Promise<"">;

```

#### apis/sendCard.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type SendCardOptions = {
    userId: string;
    phoneNumber?: string;
    ttl?: number;
};
export type SendCardResponse = {
    msgId: number;
};
export declare const sendCardFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (options: SendCardOptions, threadId: string, type?: ThreadType) => Promise<SendCardResponse>;

```

#### apis/sendDeliveredEvent.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type SendDeliveredEventResponse = "" | {
    status: number;
};
export type SendDeliveredEventMessageParams = {
    msgId: string;
    cliMsgId: string;
    uidFrom: string;
    idTo: string;
    msgType: string;
    st: number;
    at: number;
    cmd: number;
    ts: string | number;
};
export declare const sendDeliveredEventFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (isSeen: boolean, messages: SendDeliveredEventMessageParams | SendDeliveredEventMessageParams[], type?: ThreadType) => Promise<SendDeliveredEventResponse>;

```

#### apis/sendFriendRequest.d.ts

```typescript
export type SendFriendRequestResponse = "";
export declare const sendFriendRequestFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (msg: string, userId: string) => Promise<"">;

```

#### apis/sendLink.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type SendLinkOptions = {
    msg?: string;
    link: string;
    ttl?: number;
};
export type SendLinkResponse = {
    msgId: string;
};
export declare const sendLinkFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (options: SendLinkOptions, threadId: string, type?: ThreadType) => Promise<SendLinkResponse>;

```

#### apis/sendMessage.d.ts

```typescript
import { ThreadType, type TMessage, type AttachmentSource } from "../models/index.js";
export type SendMessageResult = {
    msgId: number;
};
export type SendMessageResponse = {
    message: SendMessageResult | null;
    attachment: SendMessageResult[];
};
export type SendMessageQuote = {
    content: TMessage["content"];
    msgType: TMessage["msgType"];
    propertyExt: TMessage["propertyExt"];
    uidFrom: TMessage["uidFrom"];
    msgId: TMessage["msgId"];
    cliMsgId: TMessage["cliMsgId"];
    ts: TMessage["ts"];
    ttl: TMessage["ttl"];
};
export declare enum TextStyle {
    Bold = "b",
    Italic = "i",
    Underline = "u",
    StrikeThrough = "s",
    Red = "c_db342e",
    Orange = "c_f27806",
    Yellow = "c_f7b503",
    Green = "c_15a85f",
    Small = "f_13",
    Big = "f_18",
    UnorderedList = "lst_1",
    OrderedList = "lst_2",
    Indent = "ind_$"
}
export type Style = {
    start: number;
    len: number;
    st: Exclude<TextStyle, TextStyle.Indent>;
} | {
    start: number;
    len: number;
    st: TextStyle.Indent;
    /**
     * Number of spaces used for indentation.
     */
    indentSize?: number;
};
export declare enum Urgency {
    Default = 0,
    Important = 1,
    Urgent = 2
}
export type Mention = {
    /**
     * mention position
     */
    pos: number;
    /**
     * id of the mentioned user
     */
    uid: string;
    /**
     * length of the mention
     */
    len: number;
};
export type MessageContent = {
    /**
     * Text content of the message
     */
    msg: string;
    /**
     * Text styles
     */
    styles?: Style[];
    /**
     * Urgency of the message
     */
    urgency?: Urgency;
    /**
     * Quoted message (optional)
     */
    quote?: SendMessageQuote;
    /**
     * Mentions in the message (optional)
     */
    mentions?: Mention[];
    /**
     * Attachments in the message (optional)
     */
    attachments?: AttachmentSource | AttachmentSource[];
    /**
     * Time to live in milliseconds
     */
    ttl?: number;
};
export declare const sendMessageFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (message: MessageContent | string, threadId: string, type?: ThreadType) => Promise<{
    message: SendMessageResult | null;
    attachment: SendMessageResult[];
}>;

```

#### apis/sendReport.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export declare enum ReportReason {
    Sensitive = 1,
    Annoy = 2,
    Fraud = 3,
    Other = 0
}
export type SendReportOptions = {
    reason: ReportReason.Other;
    content: string;
} | {
    reason: Exclude<ReportReason, ReportReason.Other>;
};
export type SendReportResponse = {
    reportId: string;
};
export declare const sendReportFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (options: SendReportOptions, threadId: string, type?: ThreadType) => Promise<SendReportResponse>;

```

#### apis/sendSeenEvent.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type SendSeenEventResponse = {
    status: number;
};
export type SendSeenEventMessageParams = {
    msgId: string;
    cliMsgId: string;
    uidFrom: string;
    idTo: string;
    msgType: string;
    st: number;
    at: number;
    cmd: number;
    ts: string | number;
};
export declare const sendSeenEventFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (messages: SendSeenEventMessageParams | SendSeenEventMessageParams[], type?: ThreadType) => Promise<SendSeenEventResponse>;

```

#### apis/sendSticker.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type SendStickerPayload = {
    id: number;
    cateId: number;
    type: number;
};
export type SendStickerResponse = {
    msgId: number;
};
export declare const sendStickerFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (sticker: SendStickerPayload, threadId: string, type?: ThreadType) => Promise<SendStickerResponse>;

```

#### apis/sendTypingEvent.d.ts

```typescript
import { DestType, ThreadType } from "../models/index.js";
export type SendTypingEventResponse = {
    status: number;
};
export declare const sendTypingEventFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (threadId: string, type?: ThreadType, destType?: DestType) => Promise<SendTypingEventResponse>;

```

#### apis/sendVideo.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type SendVideoOptions = {
    /**
     * Optional message to send along with the video
     */
    msg?: string;
    /**
     * URL of the video
     */
    videoUrl: string;
    /**
     * URL of the thumbnail
     */
    thumbnailUrl: string;
    /**
     * Video duration in milliseconds || Eg: video duration: 5.5s => 5.5 * 1000 = 5500
     */
    duration?: number;
    /**
     * Width of the video
     */
    width?: number;
    /**
     * Height of the video
     */
    height?: number;
    /**
     * Time to live in milliseconds (default: 0)
     */
    ttl?: number;
};
export type SendVideoResponse = {
    msgId: number;
};
export declare const sendVideoFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (options: SendVideoOptions, threadId: string, type?: ThreadType) => Promise<SendVideoResponse>;

```

#### apis/sendVoice.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type SendVoiceOptions = {
    voiceUrl: string;
    /**
     * Time to live in milliseconds (default: 0)
     */
    ttl?: number;
};
export type SendVoiceResponse = {
    msgId: string;
};
export declare const sendVoiceFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (options: SendVoiceOptions, threadId: string, type?: ThreadType) => Promise<SendVoiceResponse>;

```

#### apis/setHiddenConversations.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type SetHiddenConversationsResponse = "";
export declare const setHiddenConversationsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (hidden: boolean, threadId: string | string[], type?: ThreadType) => Promise<"">;

```

#### apis/setMute.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type SetMuteParams = {
    /**
     * Mute duration in seconds or predefined durations
     */
    duration?: MuteDuration | number;
    action?: MuteAction;
};
export type SetMuteResponse = "";
export declare enum MuteDuration {
    ONE_HOUR = 3600,
    FOUR_HOURS = 14400,
    FOREVER = -1,
    UNTIL_8AM = "until8AM"
}
export declare enum MuteAction {
    MUTE = 1,
    UNMUTE = 3
}
export declare const setMuteFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (params: SetMuteParams | undefined, threadID: string, type?: ThreadType) => Promise<"">;

```

#### apis/setPinnedConversations.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type SetPinnedConversationsResponse = "";
export declare const setPinnedConversationsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (pinned: boolean, threadId: string | string[], type?: ThreadType) => Promise<"">;

```

#### apis/sharePoll.d.ts

```typescript
export type SharePollResponse = "";
export declare const sharePollFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (pollId: number) => Promise<"">;

```

#### apis/unblockUser.d.ts

```typescript
export type UnBlockUserResponse = "";
export declare const unblockUserFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (userId: string) => Promise<"">;

```

#### apis/undo.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export type UndoPayload = {
    msgId: string | number;
    cliMsgId: string | number;
};
export type UndoResponse = {
    status: number;
};
export declare const undoFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: UndoPayload, threadId: string, type?: ThreadType) => Promise<UndoResponse>;

```

#### apis/undoFriendRequest.d.ts

```typescript
export type UndoFriendRequestResponse = "";
export declare const undoFriendRequestFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (friendId: string) => Promise<"">;

```

#### apis/updateActiveStatus.d.ts

```typescript
export type UpdateActiveStatusResponse = {
    status: boolean;
};
export declare const updateActiveStatusFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (active: boolean) => Promise<UpdateActiveStatusResponse>;

```

#### apis/updateArchivedChatList.d.ts

```typescript
import type { ThreadType } from "../models/Enum.js";
export type UpdateArchivedChatListTarget = {
    id: string;
    type: ThreadType;
};
export type UpdateArchivedChatListResponse = {
    needResync: boolean;
    version: number;
};
export declare const updateArchivedChatListFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (isArchived: boolean, conversations: UpdateArchivedChatListTarget | UpdateArchivedChatListTarget[]) => Promise<UpdateArchivedChatListResponse>;

```

#### apis/updateAutoDeleteChat.d.ts

```typescript
import { ThreadType } from "../models/index.js";
export declare enum ChatTTL {
    NO_DELETE = 0,
    ONE_DAY = 86400000,
    SEVEN_DAYS = 604800000,
    FOURTEEN_DAYS = 1209600000
}
export type UpdateAutoDeleteChatResponse = "";
export declare const updateAutoDeleteChatFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (ttl: ChatTTL, threadId: string, type?: ThreadType) => Promise<"">;

```

#### apis/updateAutoReply.d.ts

```typescript
import type { AutoReplyItem, AutoReplyScope } from "../models/index.js";
export type UpdateAutoReplyPayload = {
    id: number;
    content: string;
    isEnable: boolean;
    startTime: number;
    endTime: number;
    scope: AutoReplyScope;
    uids?: string | string[];
};
export type UpdateAutoReplyResponse = {
    item: AutoReplyItem;
    version: number;
};
export declare const updateAutoReplyFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: UpdateAutoReplyPayload) => Promise<UpdateAutoReplyResponse>;

```

#### apis/updateCatalog.d.ts

```typescript
import type { CatalogItem } from "../models/index.js";
export type UpdateCatalogPayload = {
    catalogId: string;
    catalogName: string;
};
export type UpdateCatalogResponse = {
    item: CatalogItem;
    version_ls_catalog: number;
    version_catalog: number;
};
export declare const updateCatalogFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: UpdateCatalogPayload) => Promise<UpdateCatalogResponse>;

```

#### apis/updateGroupSettings.d.ts

```typescript
export type UpdateGroupSettingsOptions = {
    /**
     * Disallow group members to change the group name and avatar
     */
    blockName?: boolean;
    /**
     * Highlight messages from owner/admins
     */
    signAdminMsg?: boolean;
    /**
     * Don't pin messages, notes, and polls to the top of a conversation
     */
    setTopicOnly?: boolean;
    /**
     * Allow new members to read most recent messages
     */
    enableMsgHistory?: boolean;
    /**
     * Membership approval
     */
    joinAppr?: boolean;
    /**
     * Disallow group members to create notes & reminders
     */
    lockCreatePost?: boolean;
    /**
     * Disallow group members to create polls
     */
    lockCreatePoll?: boolean;
    /**
     * Disallow group members to send messages
     */
    lockSendMsg?: boolean;
    /**
     * Disallow group members to view full member list (community only)
     */
    lockViewMember?: boolean;
};
export type UpdateGroupSettingsResponse = "";
export declare const updateGroupSettingsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (options: UpdateGroupSettingsOptions, groupId: string) => Promise<"">;

```

#### apis/updateHiddenConversPin.d.ts

```typescript
export type UpdateHiddenConversPinResponse = "";
export declare const updateHiddenConversPinFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (pin: string) => Promise<"">;

```

#### apis/updateLabels.d.ts

```typescript
import type { LabelData } from "../models/index.js";
export type UpdateLabelsPayload = {
    labelData: LabelData[];
    version: number;
};
export type UpdateLabelsResponse = {
    labelData: LabelData[];
    version: number;
    lastUpdateTime: number;
};
export declare const updateLabelsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: UpdateLabelsPayload) => Promise<{
    labelData: any;
    version: number;
    lastUpdateTime: number;
}>;

```

#### apis/updateLang.d.ts

```typescript
export declare enum UpdateLangAvailableLanguages {
    VI = "VI",
    EN = "EN"
}
export type UpdateLangResponse = "";
export declare const updateLangFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (language?: UpdateLangAvailableLanguages) => Promise<"">;

```

#### apis/updateProductCatalog.d.ts

```typescript
import type { AttachmentSource, ProductCatalogItem } from "../models/index.js";
export type UpdateProductCatalogPayload = {
    catalogId: string;
    productId: string;
    productName: string;
    price: string;
    description: string;
    createTime: number;
    /**
     * Upto 5 media files are allowed, will be ignored if product_photos is provided
     */
    files?: AttachmentSource[];
    /**
     * List of product photo URLs, upto 5
     *
     * You can manually get the URL using `uploadProductPhoto` api
     */
    product_photos?: string[];
};
export type UpdateProductCatalogResponse = {
    item: ProductCatalogItem;
    version_ls_catalog: number;
    version_catalog: number;
};
export declare const updateProductCatalogFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: UpdateProductCatalogPayload) => Promise<UpdateProductCatalogResponse>;

```

#### apis/updateProfile.d.ts

```typescript
import type { BusinessCategory, Gender } from "../models/index.js";
export type UpdateProfilePayload = {
    profile: {
        name: string;
        /**
         * Date of birth in the format YYYY-MM-DD
         */
        dob: `${string}-${string}-${string}`;
        gender: Gender;
    };
    biz?: Partial<{
        cate: BusinessCategory;
        description: string;
        address: string;
        website: string;
        email: string;
    }>;
};
export type UpdateProfileResponse = "";
export declare const updateProfileFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: UpdateProfilePayload) => Promise<"">;

```

#### apis/updateProfileBio.d.ts

```typescript
export type UpdateProfileBioResponse = "";
export declare const updateProfileBioFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (status: string) => Promise<"">;

```

#### apis/updateQuickMessage.d.ts

```typescript
import type { QuickMessage, AttachmentSource } from "../models/index.js";
export type UpdateQuickMessagePayload = {
    keyword: string;
    title: string;
    media?: AttachmentSource;
};
export type UpdateQuickMessageResponse = {
    item: QuickMessage;
    version: number;
};
export declare const updateQuickMessageFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (updatePayload: UpdateQuickMessagePayload, itemId: number) => Promise<UpdateQuickMessageResponse>;

```

#### apis/updateSettings.d.ts

```typescript
export type UpdateSettingsResponse = "";
export declare enum UpdateSettingsType {
    ViewBirthday = "view_birthday",
    ShowOnlineStatus = "show_online_status",
    DisplaySeenStatus = "display_seen_status",
    ReceiveMessage = "receive_message",
    AcceptCall = "accept_stranger_call",
    AddFriendViaPhone = "add_friend_via_phone",
    AddFriendViaQR = "add_friend_via_qr",
    AddFriendViaGroup = "add_friend_via_group",
    AddFriendViaContact = "add_friend_via_contact",
    DisplayOnRecommendFriend = "display_on_recommend_friend",
    ArchivedChat = "archivedChatStatus",
    QuickMessage = "quickMessageStatus"
}
export declare const updateSettingsFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (type: UpdateSettingsType, value: number) => Promise<"">;

```

#### apis/upgradeGroupToCommunity.d.ts

```typescript
export type UpgradeGroupToCommunityResponse = "";
export declare const upgradeGroupToCommunityFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (groupId: string) => Promise<"">;

```

#### apis/uploadAttachment.d.ts

```typescript
import { ThreadType, type AttachmentSource } from "../models/index.js";
export type UploadAttachmentImageResponse = {
    normalUrl: string;
    photoId: string;
    finished: number | boolean;
    hdUrl: string;
    thumbUrl: string;
    clientFileId: number;
    chunkId: number;
    fileType: "image";
    width: number;
    height: number;
    totalSize: number;
    hdSize: number;
};
export type UploadAttachmentVideoResponse = {
    finished: number | boolean;
    clientFileId: number;
    chunkId: number;
    fileType: "video";
    fileUrl: string;
    fileId: string;
    checksum: string;
    totalSize: number;
    fileName: string;
};
export type UploadAttachmentFileResponse = {
    finished: number | boolean;
    clientFileId: number;
    chunkId: number;
    fileType: "others";
    fileUrl: string;
    fileId: string;
    checksum: string;
    totalSize: number;
    fileName: string;
};
export type ImageData = {
    fileName: string;
    totalSize: number | undefined;
    width: number | undefined;
    height: number | undefined;
};
export type FileData = {
    fileName: string;
    totalSize: number;
};
export type UploadAttachmentType = UploadAttachmentImageResponse | UploadAttachmentVideoResponse | UploadAttachmentFileResponse;
export type UploadAttachmentResponse = UploadAttachmentType[];
export declare const uploadAttachmentFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (sources: AttachmentSource | AttachmentSource[], threadId: string, type?: ThreadType) => Promise<UploadAttachmentType[]>;

```

#### apis/uploadProductPhoto.d.ts

```typescript
import type { AttachmentSource } from "../models/index.js";
export type UploadProductPhotoPayload = {
    file: AttachmentSource;
};
export type UploadProductPhotoResponse = {
    normalUrl: string;
    photoId: string;
    finished: number;
    hdUrl: string;
    thumbUrl: string;
    clientFileId: number;
    chunkId: number;
};
export declare const uploadProductPhotoFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (payload: UploadProductPhotoPayload) => Promise<UploadProductPhotoResponse>;

```

#### apis/votePoll.d.ts

```typescript
import type { PollOptions } from "../models/index.js";
export type VotePollResponse = {
    options: PollOptions[];
};
export declare const votePollFactory: (ctx: import("../context.js").ContextBase, api: import("../apis.js").API) => (pollId: number, optionId: number | number[]) => Promise<VotePollResponse>;

```

### B.3 Các file `.d.ts` nằm trực tiếp dưới `dist/` (không nằm trong thư mục con `dist/apis/`)

#### dist/apis.d.ts

```typescript
import { Listener } from "./apis/listen.js";
import { acceptFriendRequestFactory } from "./apis/acceptFriendRequest.js";
import { addGroupBlockedMemberFactory } from "./apis/addGroupBlockedMember.js";
import { addGroupDeputyFactory } from "./apis/addGroupDeputy.js";
import { addPollOptionsFactory } from "./apis/addPollOptions.js";
import { addQuickMessageFactory } from "./apis/addQuickMessage.js";
import { addReactionFactory } from "./apis/addReaction.js";
import { addUnreadMarkFactory } from "./apis/addUnreadMark.js";
import { addUserToGroupFactory } from "./apis/addUserToGroup.js";
import { blockUserFactory } from "./apis/blockUser.js";
import { blockViewFeedFactory } from "./apis/blockViewFeed.js";
import { changeAccountAvatarFactory } from "./apis/changeAccountAvatar.js";
import { changeFriendAliasFactory } from "./apis/changeFriendAlias.js";
import { changeGroupAvatarFactory } from "./apis/changeGroupAvatar.js";
import { changeGroupNameFactory } from "./apis/changeGroupName.js";
import { changeGroupOwnerFactory } from "./apis/changeGroupOwner.js";
import { createAutoReplyFactory } from "./apis/createAutoReply.js";
import { createCatalogFactory } from "./apis/createCatalog.js";
import { createGroupFactory } from "./apis/createGroup.js";
import { createNoteFactory } from "./apis/createNote.js";
import { createPollFactory } from "./apis/createPoll.js";
import { createProductCatalogFactory } from "./apis/createProductCatalog.js";
import { createReminderFactory } from "./apis/createReminder.js";
import { deleteAutoReplyFactory } from "./apis/deleteAutoReply.js";
import { deleteAvatarFactory } from "./apis/deleteAvatar.js";
import { deleteCatalogFactory } from "./apis/deleteCatalog.js";
import { deleteChatFactory } from "./apis/deleteChat.js";
import { deleteGroupInviteBoxFactory } from "./apis/deleteGroupInviteBox.js";
import { deleteMessageFactory } from "./apis/deleteMessage.js";
import { deleteProductCatalogFactory } from "./apis/deleteProductCatalog.js";
import { disableGroupLinkFactory } from "./apis/disableGroupLink.js";
import { disperseGroupFactory } from "./apis/disperseGroup.js";
import { editNoteFactory } from "./apis/editNote.js";
import { editReminderFactory } from "./apis/editReminder.js";
import { enableGroupLinkFactory } from "./apis/enableGroupLink.js";
import { fetchAccountInfoFactory } from "./apis/fetchAccountInfo.js";
import { findUserFactory } from "./apis/findUser.js";
import { findUserByUsernameFactory } from "./apis/findUserByUsername.js";
import { forwardMessageFactory } from "./apis/forwardMessage.js";
import { getAliasListFactory } from "./apis/getAliasList.js";
import { getAllFriendsFactory } from "./apis/getAllFriends.js";
import { getAllGroupsFactory } from "./apis/getAllGroups.js";
import { getArchivedChatListFactory } from "./apis/getArchivedChatList.js";
import { getAutoDeleteChatFactory } from "./apis/getAutoDeleteChat.js";
import { getAutoReplyListFactory } from "./apis/getAutoReplyList.js";
import { getAvatarListFactory } from "./apis/getAvatarList.js";
import { getAvatarUrlProfileFactory } from "./apis/getAvatarUrlProfile.js";
import { getBizAccountFactory } from "./apis/getBizAccount.js";
import { getCatalogListFactory } from "./apis/getCatalogList.js";
import { getCloseFriendsFactory } from "./apis/getCloseFriends.js";
import { getContextFactory } from "./apis/getContext.js";
import { getCookieFactory } from "./apis/getCookie.js";
import { getFriendBoardListFactory } from "./apis/getFriendBoardList.js";
import { getFriendOnlinesFactory } from "./apis/getFriendOnlines.js";
import { getFriendRecommendationsFactory } from "./apis/getFriendRecommendations.js";
import { getFriendRequestStatusFactory } from "./apis/getFriendRequestStatus.js";
import { getFullAvatarFactory } from "./apis/getFullAvatar.js";
import { getGroupBlockedMemberFactory } from "./apis/getGroupBlockedMember.js";
import { getGroupChatHistoryFactory } from "./apis/getGroupChatHistory.js";
import { getGroupInfoFactory } from "./apis/getGroupInfo.js";
import { getGroupInviteBoxInfoFactory } from "./apis/getGroupInviteBoxInfo.js";
import { getGroupInviteBoxListFactory } from "./apis/getGroupInviteBoxList.js";
import { getGroupLinkDetailFactory } from "./apis/getGroupLinkDetail.js";
import { getGroupLinkInfoFactory } from "./apis/getGroupLinkInfo.js";
import { getGroupMembersInfoFactory } from "./apis/getGroupMembersInfo.js";
import { getHiddenConversationsFactory } from "./apis/getHiddenConversations.js";
import { getLabelsFactory } from "./apis/getLabels.js";
import { getListBoardFactory } from "./apis/getListBoard.js";
import { getListReminderFactory } from "./apis/getListReminder.js";
import { getMultiUsersByPhonesFactory } from "./apis/getMultiUsersByPhones.js";
import { getMuteFactory } from "./apis/getMute.js";
import { getOwnIdFactory } from "./apis/getOwnId.js";
import { getPendingGroupMembersFactory } from "./apis/getPendingGroupMembers.js";
import { getPinConversationsFactory } from "./apis/getPinConversations.js";
import { getPollDetailFactory } from "./apis/getPollDetail.js";
import { getProductCatalogListFactory } from "./apis/getProductCatalogList.js";
import { getQRFactory } from "./apis/getQR.js";
import { getQuickMessageListFactory } from "./apis/getQuickMessageList.js";
import { getRelatedFriendGroupFactory } from "./apis/getRelatedFriendGroup.js";
import { getReminderFactory } from "./apis/getReminder.js";
import { getReminderResponsesFactory } from "./apis/getReminderResponses.js";
import { getSentFriendRequestFactory } from "./apis/getSentFriendRequest.js";
import { getSettingsFactory } from "./apis/getSettings.js";
import { getStickerCategoryDetailFactory } from "./apis/getStickerCategoryDetail.js";
import { getStickersFactory } from "./apis/getStickers.js";
import { getStickersDetailFactory } from "./apis/getStickersDetail.js";
import { getUnreadMarkFactory } from "./apis/getUnreadMark.js";
import { getUserInfoFactory } from "./apis/getUserInfo.js";
import { inviteUserToGroupsFactory } from "./apis/inviteUserToGroups.js";
import { joinGroupInviteBoxFactory } from "./apis/joinGroupInviteBox.js";
import { joinGroupLinkFactory } from "./apis/joinGroupLink.js";
import { keepAliveFactory } from "./apis/keepAlive.js";
import { lastOnlineFactory } from "./apis/lastOnline.js";
import { leaveGroupFactory } from "./apis/leaveGroup.js";
import { lockPollFactory } from "./apis/lockPoll.js";
import { parseLinkFactory } from "./apis/parseLink.js";
import { rejectFriendRequestFactory } from "./apis/rejectFriendRequest.js";
import { removeFriendFactory } from "./apis/removeFriend.js";
import { removeFriendAliasFactory } from "./apis/removeFriendAlias.js";
import { removeGroupBlockedMemberFactory } from "./apis/removeGroupBlockedMember.js";
import { removeGroupDeputyFactory } from "./apis/removeGroupDeputy.js";
import { removeQuickMessageFactory } from "./apis/removeQuickMessage.js";
import { removeReminderFactory } from "./apis/removeReminder.js";
import { removeUnreadMarkFactory } from "./apis/removeUnreadMark.js";
import { removeUserFromGroupFactory } from "./apis/removeUserFromGroup.js";
import { resetHiddenConversPinFactory } from "./apis/resetHiddenConversPin.js";
import { reuseAvatarFactory } from "./apis/reuseAvatar.js";
import { reviewPendingMemberRequestFactory } from "./apis/reviewPendingMemberRequest.js";
import { searchStickerFactory } from "./apis/searchSticker.js";
import { sendBankCardFactory } from "./apis/sendBankCard.js";
import { sendCardFactory } from "./apis/sendCard.js";
import { sendDeliveredEventFactory } from "./apis/sendDeliveredEvent.js";
import { sendFriendRequestFactory } from "./apis/sendFriendRequest.js";
import { sendLinkFactory } from "./apis/sendLink.js";
import { sendMessageFactory } from "./apis/sendMessage.js";
import { sendReportFactory } from "./apis/sendReport.js";
import { sendSeenEventFactory } from "./apis/sendSeenEvent.js";
import { sendStickerFactory } from "./apis/sendSticker.js";
import { sendTypingEventFactory } from "./apis/sendTypingEvent.js";
import { sendVideoFactory } from "./apis/sendVideo.js";
import { sendVoiceFactory } from "./apis/sendVoice.js";
import { setHiddenConversationsFactory } from "./apis/setHiddenConversations.js";
import { setMuteFactory } from "./apis/setMute.js";
import { setPinnedConversationsFactory } from "./apis/setPinnedConversations.js";
import { sharePollFactory } from "./apis/sharePoll.js";
import { unblockUserFactory } from "./apis/unblockUser.js";
import { undoFactory } from "./apis/undo.js";
import { undoFriendRequestFactory } from "./apis/undoFriendRequest.js";
import { updateActiveStatusFactory } from "./apis/updateActiveStatus.js";
import { updateArchivedChatListFactory } from "./apis/updateArchivedChatList.js";
import { updateAutoDeleteChatFactory } from "./apis/updateAutoDeleteChat.js";
import { updateAutoReplyFactory } from "./apis/updateAutoReply.js";
import { updateCatalogFactory } from "./apis/updateCatalog.js";
import { updateGroupSettingsFactory } from "./apis/updateGroupSettings.js";
import { updateHiddenConversPinFactory } from "./apis/updateHiddenConversPin.js";
import { updateLabelsFactory } from "./apis/updateLabels.js";
import { updateLangFactory } from "./apis/updateLang.js";
import { updateProductCatalogFactory } from "./apis/updateProductCatalog.js";
import { updateProfileFactory } from "./apis/updateProfile.js";
import { updateProfileBioFactory } from "./apis/updateProfileBio.js";
import { updateQuickMessageFactory } from "./apis/updateQuickMessage.js";
import { updateSettingsFactory } from "./apis/updateSettings.js";
import { upgradeGroupToCommunityFactory } from "./apis/upgradeGroupToCommunity.js";
import { uploadAttachmentFactory } from "./apis/uploadAttachment.js";
import { uploadProductPhotoFactory } from "./apis/uploadProductPhoto.js";
import { votePollFactory } from "./apis/votePoll.js";
import { customFactory } from "./apis/custom.js";
import type { ZPWServiceMap, ContextSession } from "./context.js";
export declare class API {
    zpwServiceMap: ZPWServiceMap;
    listener: Listener;
    acceptFriendRequest: ReturnType<typeof acceptFriendRequestFactory>;
    addGroupBlockedMember: ReturnType<typeof addGroupBlockedMemberFactory>;
    addGroupDeputy: ReturnType<typeof addGroupDeputyFactory>;
    addPollOptions: ReturnType<typeof addPollOptionsFactory>;
    addQuickMessage: ReturnType<typeof addQuickMessageFactory>;
    addReaction: ReturnType<typeof addReactionFactory>;
    addUnreadMark: ReturnType<typeof addUnreadMarkFactory>;
    addUserToGroup: ReturnType<typeof addUserToGroupFactory>;
    blockUser: ReturnType<typeof blockUserFactory>;
    blockViewFeed: ReturnType<typeof blockViewFeedFactory>;
    changeAccountAvatar: ReturnType<typeof changeAccountAvatarFactory>;
    changeFriendAlias: ReturnType<typeof changeFriendAliasFactory>;
    changeGroupAvatar: ReturnType<typeof changeGroupAvatarFactory>;
    changeGroupName: ReturnType<typeof changeGroupNameFactory>;
    changeGroupOwner: ReturnType<typeof changeGroupOwnerFactory>;
    createAutoReply: ReturnType<typeof createAutoReplyFactory>;
    createCatalog: ReturnType<typeof createCatalogFactory>;
    createGroup: ReturnType<typeof createGroupFactory>;
    createNote: ReturnType<typeof createNoteFactory>;
    createPoll: ReturnType<typeof createPollFactory>;
    createProductCatalog: ReturnType<typeof createProductCatalogFactory>;
    createReminder: ReturnType<typeof createReminderFactory>;
    deleteAutoReply: ReturnType<typeof deleteAutoReplyFactory>;
    deleteAvatar: ReturnType<typeof deleteAvatarFactory>;
    deleteCatalog: ReturnType<typeof deleteCatalogFactory>;
    deleteChat: ReturnType<typeof deleteChatFactory>;
    deleteGroupInviteBox: ReturnType<typeof deleteGroupInviteBoxFactory>;
    deleteMessage: ReturnType<typeof deleteMessageFactory>;
    deleteProductCatalog: ReturnType<typeof deleteProductCatalogFactory>;
    disableGroupLink: ReturnType<typeof disableGroupLinkFactory>;
    disperseGroup: ReturnType<typeof disperseGroupFactory>;
    editNote: ReturnType<typeof editNoteFactory>;
    editReminder: ReturnType<typeof editReminderFactory>;
    enableGroupLink: ReturnType<typeof enableGroupLinkFactory>;
    fetchAccountInfo: ReturnType<typeof fetchAccountInfoFactory>;
    findUser: ReturnType<typeof findUserFactory>;
    findUserByUsername: ReturnType<typeof findUserByUsernameFactory>;
    forwardMessage: ReturnType<typeof forwardMessageFactory>;
    getAliasList: ReturnType<typeof getAliasListFactory>;
    getAllFriends: ReturnType<typeof getAllFriendsFactory>;
    getAllGroups: ReturnType<typeof getAllGroupsFactory>;
    getArchivedChatList: ReturnType<typeof getArchivedChatListFactory>;
    getAutoDeleteChat: ReturnType<typeof getAutoDeleteChatFactory>;
    getAutoReplyList: ReturnType<typeof getAutoReplyListFactory>;
    getAvatarList: ReturnType<typeof getAvatarListFactory>;
    getAvatarUrlProfile: ReturnType<typeof getAvatarUrlProfileFactory>;
    getBizAccount: ReturnType<typeof getBizAccountFactory>;
    getCatalogList: ReturnType<typeof getCatalogListFactory>;
    getCloseFriends: ReturnType<typeof getCloseFriendsFactory>;
    getContext: ReturnType<typeof getContextFactory>;
    getCookie: ReturnType<typeof getCookieFactory>;
    getFriendBoardList: ReturnType<typeof getFriendBoardListFactory>;
    getFriendOnlines: ReturnType<typeof getFriendOnlinesFactory>;
    getFriendRecommendations: ReturnType<typeof getFriendRecommendationsFactory>;
    getFriendRequestStatus: ReturnType<typeof getFriendRequestStatusFactory>;
    getFullAvatar: ReturnType<typeof getFullAvatarFactory>;
    getGroupBlockedMember: ReturnType<typeof getGroupBlockedMemberFactory>;
    getGroupChatHistory: ReturnType<typeof getGroupChatHistoryFactory>;
    getGroupInfo: ReturnType<typeof getGroupInfoFactory>;
    getGroupInviteBoxInfo: ReturnType<typeof getGroupInviteBoxInfoFactory>;
    getGroupInviteBoxList: ReturnType<typeof getGroupInviteBoxListFactory>;
    getGroupLinkDetail: ReturnType<typeof getGroupLinkDetailFactory>;
    getGroupLinkInfo: ReturnType<typeof getGroupLinkInfoFactory>;
    getGroupMembersInfo: ReturnType<typeof getGroupMembersInfoFactory>;
    getHiddenConversations: ReturnType<typeof getHiddenConversationsFactory>;
    getLabels: ReturnType<typeof getLabelsFactory>;
    getListBoard: ReturnType<typeof getListBoardFactory>;
    getListReminder: ReturnType<typeof getListReminderFactory>;
    getMultiUsersByPhones: ReturnType<typeof getMultiUsersByPhonesFactory>;
    getMute: ReturnType<typeof getMuteFactory>;
    getOwnId: ReturnType<typeof getOwnIdFactory>;
    getPendingGroupMembers: ReturnType<typeof getPendingGroupMembersFactory>;
    getPinConversations: ReturnType<typeof getPinConversationsFactory>;
    getPollDetail: ReturnType<typeof getPollDetailFactory>;
    getProductCatalogList: ReturnType<typeof getProductCatalogListFactory>;
    getQR: ReturnType<typeof getQRFactory>;
    getQuickMessageList: ReturnType<typeof getQuickMessageListFactory>;
    getRelatedFriendGroup: ReturnType<typeof getRelatedFriendGroupFactory>;
    getReminder: ReturnType<typeof getReminderFactory>;
    getReminderResponses: ReturnType<typeof getReminderResponsesFactory>;
    getSentFriendRequest: ReturnType<typeof getSentFriendRequestFactory>;
    getSettings: ReturnType<typeof getSettingsFactory>;
    getStickerCategoryDetail: ReturnType<typeof getStickerCategoryDetailFactory>;
    getStickers: ReturnType<typeof getStickersFactory>;
    getStickersDetail: ReturnType<typeof getStickersDetailFactory>;
    getUnreadMark: ReturnType<typeof getUnreadMarkFactory>;
    getUserInfo: ReturnType<typeof getUserInfoFactory>;
    inviteUserToGroups: ReturnType<typeof inviteUserToGroupsFactory>;
    joinGroupInviteBox: ReturnType<typeof joinGroupInviteBoxFactory>;
    joinGroupLink: ReturnType<typeof joinGroupLinkFactory>;
    keepAlive: ReturnType<typeof keepAliveFactory>;
    lastOnline: ReturnType<typeof lastOnlineFactory>;
    leaveGroup: ReturnType<typeof leaveGroupFactory>;
    lockPoll: ReturnType<typeof lockPollFactory>;
    parseLink: ReturnType<typeof parseLinkFactory>;
    rejectFriendRequest: ReturnType<typeof rejectFriendRequestFactory>;
    removeFriend: ReturnType<typeof removeFriendFactory>;
    removeFriendAlias: ReturnType<typeof removeFriendAliasFactory>;
    removeGroupBlockedMember: ReturnType<typeof removeGroupBlockedMemberFactory>;
    removeGroupDeputy: ReturnType<typeof removeGroupDeputyFactory>;
    removeQuickMessage: ReturnType<typeof removeQuickMessageFactory>;
    removeReminder: ReturnType<typeof removeReminderFactory>;
    removeUnreadMark: ReturnType<typeof removeUnreadMarkFactory>;
    removeUserFromGroup: ReturnType<typeof removeUserFromGroupFactory>;
    resetHiddenConversPin: ReturnType<typeof resetHiddenConversPinFactory>;
    reuseAvatar: ReturnType<typeof reuseAvatarFactory>;
    reviewPendingMemberRequest: ReturnType<typeof reviewPendingMemberRequestFactory>;
    searchSticker: ReturnType<typeof searchStickerFactory>;
    sendBankCard: ReturnType<typeof sendBankCardFactory>;
    sendCard: ReturnType<typeof sendCardFactory>;
    sendDeliveredEvent: ReturnType<typeof sendDeliveredEventFactory>;
    sendFriendRequest: ReturnType<typeof sendFriendRequestFactory>;
    sendLink: ReturnType<typeof sendLinkFactory>;
    sendMessage: ReturnType<typeof sendMessageFactory>;
    sendReport: ReturnType<typeof sendReportFactory>;
    sendSeenEvent: ReturnType<typeof sendSeenEventFactory>;
    sendSticker: ReturnType<typeof sendStickerFactory>;
    sendTypingEvent: ReturnType<typeof sendTypingEventFactory>;
    sendVideo: ReturnType<typeof sendVideoFactory>;
    sendVoice: ReturnType<typeof sendVoiceFactory>;
    setHiddenConversations: ReturnType<typeof setHiddenConversationsFactory>;
    setMute: ReturnType<typeof setMuteFactory>;
    setPinnedConversations: ReturnType<typeof setPinnedConversationsFactory>;
    sharePoll: ReturnType<typeof sharePollFactory>;
    unblockUser: ReturnType<typeof unblockUserFactory>;
    undo: ReturnType<typeof undoFactory>;
    undoFriendRequest: ReturnType<typeof undoFriendRequestFactory>;
    updateActiveStatus: ReturnType<typeof updateActiveStatusFactory>;
    updateArchivedChatList: ReturnType<typeof updateArchivedChatListFactory>;
    updateAutoDeleteChat: ReturnType<typeof updateAutoDeleteChatFactory>;
    updateAutoReply: ReturnType<typeof updateAutoReplyFactory>;
    updateCatalog: ReturnType<typeof updateCatalogFactory>;
    updateGroupSettings: ReturnType<typeof updateGroupSettingsFactory>;
    updateHiddenConversPin: ReturnType<typeof updateHiddenConversPinFactory>;
    updateLabels: ReturnType<typeof updateLabelsFactory>;
    updateLang: ReturnType<typeof updateLangFactory>;
    updateProductCatalog: ReturnType<typeof updateProductCatalogFactory>;
    updateProfile: ReturnType<typeof updateProfileFactory>;
    updateProfileBio: ReturnType<typeof updateProfileBioFactory>;
    updateQuickMessage: ReturnType<typeof updateQuickMessageFactory>;
    updateSettings: ReturnType<typeof updateSettingsFactory>;
    upgradeGroupToCommunity: ReturnType<typeof upgradeGroupToCommunityFactory>;
    uploadAttachment: ReturnType<typeof uploadAttachmentFactory>;
    uploadProductPhoto: ReturnType<typeof uploadProductPhotoFactory>;
    votePoll: ReturnType<typeof votePollFactory>;
    custom: ReturnType<typeof customFactory>;
    constructor(ctx: ContextSession, zpwServiceMap: ZPWServiceMap, wsUrls: string[]);
}
```

#### dist/context.d.ts

```typescript
import type { Agent } from "http";
import type { CookieJar } from "tough-cookie";
type UploadEventData = {
    fileUrl: string;
    fileId: string;
};
export type UploadCallback = (data: UploadEventData) => unknown;
type ShareFileSettings = {
    big_file_domain_list: string[];
    max_size_share_file_v2: number;
    max_size_share_file_v3: number;
    file_upload_show_icon_1GB: boolean;
    restricted_ext: string;
    next_file_time: number;
    max_file: number;
    max_size_photo: number;
    max_size_share_file: number;
    max_size_resize_photo: number;
    max_size_gif: number;
    max_size_original_photo: number;
    chunk_size_file: number;
    restricted_ext_file: string[];
};
type SocketSettings = {
    rotate_error_codes: number[];
    retries: {
        [key: string]: {
            max?: number;
            times: number[] | number;
        };
    };
    debug: {
        enable: boolean;
    };
    ping_interval: number;
    reset_endpoint: number;
    queue_ctrl_actionid_map: {
        "611_0": string;
        "610_1": string;
        "610_0": string;
        "603_0": string;
        "611_1": string;
    };
    close_and_retry_codes: number[];
    max_msg_size: number;
    enable_ctrl_socket: boolean;
    reconnect_after_fallback: boolean;
    enable_chat_socket: boolean;
    submit_wss_log: boolean;
    disable_lp: boolean;
    offline_monitor: {
        enable: boolean;
    };
};
type LoginInfo = {
    [key: string]: any;
    haspcclient: number;
    public_ip: string;
    language: string;
    send2me_id: string;
    zpw_service_map_v3: {
        other_contact: string[];
        chat_e2e: string[];
        workspace: string[];
        catalog: string[];
        boards: string[];
        downloadStickerUrl: string[];
        sp_contact: string[];
        zcloud_up_file: string[];
        media_store_send2me: string[];
        push_act: string[];
        aext: string[];
        zfamily: string[];
        group_poll: string[];
        group_cloud_message: string[];
        media_store: string[];
        file: string[];
        auto_reply: string[];
        sync_action: string[];
        friendLan: string[];
        friend: string[];
        alias: string[];
        zimsg: string[];
        group_board: string[];
        conversation: string[];
        group: string[];
        fallback_LP: string[];
        friend_board: string[];
        up_file: string[];
        zavi: string[];
        reaction: string[];
        voice_call: string[];
        profile: string[];
        sticker: string[];
        label: string[];
        consent: string[];
        zcloud: string[];
        chat: string[];
        todoUrl: string[];
        recent_search: string[];
        group_e2e: string[];
        quick_message: string[];
    };
};
type ExtraVer = {
    phonebook: number;
    conv_label: string;
    friend: string;
    ver_sticker_giphy_suggest: number;
    ver_giphy_cate: number;
    alias: string;
    ver_sticker_cate_list: number;
    block_friend: string;
};
export type ZPWServiceMap = LoginInfo["zpw_service_map_v3"];
export type AppContextBase = {
    uid: string;
    imei: string;
    cookie: CookieJar;
    userAgent: string;
    language: string;
    secretKey: string | null;
    zpwServiceMap: ZPWServiceMap;
    settings: {
        [key: string]: any;
        features: {
            [key: string]: any;
            sharefile: ShareFileSettings;
            socket: SocketSettings;
        };
        keepalive: {
            alway_keepalive: number;
            keepalive_duration: number;
            time_deactive: number;
        };
    };
    loginInfo: LoginInfo;
    extraVer: ExtraVer;
};
export type ImageMetadataGetterResponse = {
    width: number;
    height: number;
    size: number;
} | null;
export type ImageMetadataGetter = (filePath: string) => Promise<ImageMetadataGetterResponse>;
export type Options = {
    selfListen: boolean;
    checkUpdate: boolean;
    logging: boolean;
    apiType: number;
    apiVersion: number;
    agent?: Agent;
    /**
     * Optional fetch implementation for polyfills in non-standard environments.
     * If using proxy, `node-fetch` is highly recommended.
     */
    polyfill: typeof fetch;
    imageMetadataGetter?: ImageMetadataGetter;
};
declare class CallbacksMap extends Map<string, UploadCallback> {
    /**
     * @param ttl Time to live in milliseconds. Default is 5 minutes.
     */
    set(key: string, value: UploadCallback, ttl?: number): this;
}
export type AppContextExtended = {
    uploadCallbacks: CallbacksMap;
    options: Options;
    readonly API_TYPE: number;
    readonly API_VERSION: number;
};
export type ContextBase = Partial<AppContextBase> & AppContextExtended;
export declare const createContext: (apiType?: number, apiVersion?: number) => ContextBase;
export type ContextSession = AppContextBase & AppContextExtended & {
    secretKey: string;
};
export declare function isContextSession(ctx: ContextBase): ctx is ContextSession;
export declare const MAX_MESSAGES_PER_SEND = 50;
export {};
```

#### dist/update.d.ts

```typescript
import type { ContextBase } from "./context.js";
export declare function checkUpdate(ctx: ContextBase): Promise<void>;
```

#### dist/utils.d.ts

```typescript
import cryptojs from "crypto-js";
import { type ContextSession, type ContextBase } from "./context.js";
import { FriendEventType } from "./models/FriendEvent.js";
import { GroupEventType } from "./models/GroupEvent.js";
import type { API } from "./zalo.js";
import type { AttachmentSource } from "./models/Attachment.js";
export declare const isBun: boolean;
export declare function hasOwn(obj: Record<string, unknown>, key: string): key is keyof typeof obj;
/**
 * Get signed key for API requests.
 *
 * @param type
 * @param params
 * @returns MD5 hash
 *
 */
export declare function getSignKey(type: string, params: Record<string, unknown>): string;
/**
 *
 * @param baseURL
 * @param params
 * @param apiVersion automatically add zalo api version to url params
 * @returns
 *
 */
export declare function makeURL(ctx: ContextBase, baseURL: string, params?: Record<string, string | number>, apiVersion?: boolean): string;
export declare class ParamsEncryptor {
    private zcid;
    private enc_ver;
    private zcid_ext;
    private encryptKey;
    constructor({ type, imei, firstLaunchTime }: {
        type: number;
        imei: string;
        firstLaunchTime: number;
    });
    getEncryptKey(): string;
    createZcid(type: number, imei: string, firstLaunchTime: number): void;
    createEncryptKey(e?: number): boolean;
    getParams(): {
        zcid: string;
        zcid_ext: string;
        enc_ver: string;
    } | null;
    static processStr(e: string): {
        even: null;
        odd: null;
    } | {
        even: string[];
        odd: string[];
    };
    static randomString(e?: number, t?: number): string;
    static encodeAES(e: string, message: string, type: "hex" | "base64", uppercase: boolean, s?: number): string | null;
}
export declare function decryptResp(key: string, data: string): Record<string, unknown> | null | string;
export declare function decodeBase64ToBuffer(data: string): Buffer;
export declare function decodeUnit8Array(data: Uint8Array): string | null;
export declare function encodeAES(secretKey: string, data: cryptojs.lib.WordArray | string, t?: number): string | null;
export declare function decodeAES(secretKey: string, data: string, t?: number): string | null;
export declare function getDefaultHeaders(ctx: ContextBase, origin?: string): Promise<{
    Accept: string;
    "Accept-Encoding": string;
    "Accept-Language": string;
    "content-type": string;
    Cookie: string;
    Origin: string;
    Referer: string;
    "User-Agent": string;
}>;
export declare function request(ctx: ContextBase, url: string, options?: RequestInit, raw?: boolean): Promise<Response>;
export declare function getImageMetaData(ctx: ContextBase, filePath: string): Promise<{
    fileName: string;
    totalSize: number;
    width: number;
    height: number;
}>;
export declare function getFileSize(filePath: string): Promise<number>;
export declare function getGifMetaData(ctx: ContextBase, filePath: string): Promise<{
    fileName: string;
    totalSize: number;
    width: number;
    height: number;
}>;
export declare function decodeEventData(parsed: Record<string, unknown>, cipherKey?: string): Promise<any>;
export declare function getMd5LargeFileObject(source: AttachmentSource, fileSize: number): Promise<{
    currentChunk: number;
    data: string;
}>;
export declare const logger: (ctx: {
    options: {
        logging?: boolean;
    };
}) => {
    verbose: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    success: (...args: unknown[]) => void;
    timestamp: (...args: unknown[]) => void;
};
export declare function getClientMessageType(msgType: string): 1 | 31 | 32 | 44 | 46 | 49 | 36 | 37 | 38 | 43;
export declare function strPadLeft(e: number | string, t: string, n: number): string;
export declare function formatTime(format: string, timestamp?: number): string;
export declare function getFullTimeFromMillisecond(e: number): string;
export declare function getFileExtension(e: string): string;
export declare function getFileName(e: string): string;
export declare function removeUndefinedKeys(e: Record<string, unknown>): Record<string, unknown>;
export declare function getGroupEventType(act: string): GroupEventType;
export declare function getFriendEventType(act: string): FriendEventType;
type ZaloResponse<T> = {
    data: T | null;
    error: {
        message: string;
        code?: number;
    } | null;
};
export declare function handleZaloResponse<T = unknown>(ctx: ContextSession, response: Response, isEncrypted?: boolean): Promise<ZaloResponse<T>>;
export declare function resolveResponse<T = unknown>(ctx: ContextSession, res: Response, cb?: (result: ZaloResponse<unknown>) => T, isEncrypted?: boolean): Promise<T>;
export type FactoryUtils<T> = {
    makeURL: (baseURL: string, params?: Record<string, string | number>, apiVersion?: boolean) => ReturnType<typeof makeURL>;
    encodeAES: (data: cryptojs.lib.WordArray | string, t?: number) => ReturnType<typeof encodeAES>;
    request: (url: string, options?: RequestInit, raw?: boolean) => ReturnType<typeof request>;
    logger: ReturnType<typeof logger>;
    resolve: (res: Response, cb?: (result: ZaloResponse<unknown>) => T, isEncrypted?: boolean) => ReturnType<typeof resolveResponse<T>>;
};
export declare function apiFactory<T>(): <K extends (api: API, ctx: ContextSession, utils: FactoryUtils<T>) => unknown>(callback: K) => (ctx: ContextBase, api: API) => ReturnType<K>;
export declare function generateZaloUUID(userAgent: string): string;
/**
 * Encrypts a 4-digit PIN to a 32-character hex string
 * @param pin 4-digit PIN number
 * @returns 32-character hex string
 */
export declare function encryptPin(pin: string): string;
/**
 * Decrypts a 32-character hex string back to 4-digit PIN
 * Note: This is a one-way hash, so we can only verify if a PIN matches the hash
 * @param encryptedPin 32-character hex string
 * @param pin 4-digit PIN to verify
 * @returns true if the PIN matches the hash
 *
 * @example
 * const encryptedPin = (await api.getHiddenConversations()).pin;
 * checking pin created..
 * const isValid = validatePin(encryptedPin, "1234"); // true if pin created is 1234
 * const isInvalid = validatePin(encryptedPin, "5678"); // false if not pin created is 5678
 */
export declare function validatePin(encryptedPin: string, pin: string): boolean;
/**
 * Converts a hex color code to a negative color number used by Zalo API
 * @param hex Hex color code (e.g. '#00FF00' or '00FF00')
 * @returns Negative color number (e.g. -16711936)
 *
 * @example
 * const negativeColor = hexToNegativeColor('#00FF00'); // Result: -16711936
 */
export declare function hexToNegativeColor(hex: string): number;
/**
 * Converts a negative color number from Zalo API to hex color code
 * @param negativeColor Negative color number (e.g. -16711936)
 * @returns Hex color code (e.g. '#00FF00')
 *
 * @example
 * const hexColor = negativeColorToHex(-16711936); // Result: '#00FF00'
 */
export declare function negativeColorToHex(negativeColor: number): string;
export {};
```

#### dist/zalo.d.ts

```typescript
import { type LoginQRCallback } from "./apis/loginQR.js";
import { type Options } from "./context.js";
import toughCookie from "tough-cookie";
import { API } from "./apis.js";
export type Cookie = {
    domain: string;
    expirationDate: number;
    hostOnly: boolean;
    httpOnly: boolean;
    name: string;
    path: string;
    sameSite: string;
    secure: boolean;
    session: boolean;
    storeId: string;
    value: string;
};
export type Credentials = {
    imei: string;
    cookie: Cookie[] | toughCookie.SerializedCookie[] | {
        url: string;
        cookies: Cookie[];
    };
    userAgent: string;
    language?: string;
};
export declare class Zalo {
    private options;
    private enableEncryptParam;
    constructor(options?: Partial<Options>);
    private parseCookies;
    private validateParams;
    login(credentials: Credentials): Promise<API>;
    private loginCookie;
    loginQR(options?: {
        userAgent?: string;
        language?: string;
        qrPath?: string;
    }, callback?: LoginQRCallback): Promise<API>;
}
export { API };
```

---

## PHẦN C — Listener (file dist/apis/listen.js, không có listen.cjs)

### C.1 Dòng chứa emit, .on(, event (grep tương đương)

```
import EventEmitter from "events";
import { initializeFriendEvent } from "../models/FriendEvent.js";
import { initializeGroupEvent } from "../models/GroupEvent.js";
import { decodeEventData, getFriendEventType, getGroupEventType, hasOwn, logger, makeURL } from "../utils.js";
export class Listener extends EventEmitter {
            this.emit("connected");
        ws.onclose = (event) => {
            this.emit("disconnected", event.code, event.reason);
            const retry = retryOnClose && this.canRetry(event.code);
                const shouldRotate = this.shouldRotate(event.code);
                this.onClosedCallback(event.code, event.reason);
                this.emit("closed", event.code, event.reason);
        ws.onerror = (event) => {
            this.onErrorCallback(event);
            this.emit("error", event);
        ws.onmessage = async (event) => {
            const { data } = event;
                    this.emit("cipher_key", parsed.key);
                            data: { eventId: Date.now() },
                    const parsedData = (await decodeEventData(parsed, this.cipherKey)).data;
                            this.emit("undo", undoObject);
                            this.emit("message", messageObject);
                    const parsedData = (await decodeEventData(parsed, this.cipherKey)).data;
                            this.emit("undo", undoObject);
                            this.emit("message", messageObject);
                    const parsedData = (await decodeEventData(parsed, this.cipherKey)).data;
                            this.emit("upload_attachment", data);
                            // for some reason, Zalo send both join and join_reject event when admin approve join requests
                            // Zalo itself doesn't seem to handle this properly either, so we gonna ignore the join_reject event
                            const groupEventData = typeof control.content.data == "string"
                            const groupEvent = initializeGroupEvent(this.ctx.uid, groupEventData, getGroupEventType(control.content.act), control.content.act);
                            if (groupEvent.isSelf && !this.selfListen)
                            this.emit("group_event", groupEvent);
                            // Zalo send both req and req_v2 event when user send friend request
                            // Zalo itself doesn't seem to handle this properly either, so we gonna ignore the req event
                            const friendEventData = typeof control.content.data == "string"
                            if (typeof friendEventData == "object" &&
                                "topic" in friendEventData &&
                                typeof friendEventData.topic == "object" &&
                                "params" in friendEventData.topic) {
                                friendEventData.topic.params = JSON.parse(`${friendEventData.topic.params}`);
                            const friendEvent = initializeFriendEvent(this.ctx.uid, typeof friendEventData == "number" ? control.content.data : friendEventData, getFriendEventType(control.content.act));
                            if (friendEvent.isSelf && !this.selfListen)
                            this.emit("friend_event", friendEvent);
                    const parsedData = (await decodeEventData(parsed, this.cipherKey)).data;
                        this.emit("reaction", reactionObject);
                        this.emit("reaction", reactionObject);
                    const parsedData = (await decodeEventData(parsed, this.cipherKey)).data;
                    this.emit("old_reactions", reactionObjects, isGroup);
                    const parsedData = (await decodeEventData(parsed, this.cipherKey)).data;
                    this.emit("old_messages", responseMsgs, ThreadType.User);
                    const parsedData = (await decodeEventData(parsed, this.cipherKey)).data;
                    this.emit("old_messages", responseMsgs, ThreadType.Group);
                    const parsedData = (await decodeEventData(parsed, this.cipherKey)).data;
                                this.emit("typing", typingObject);
                                // For a group with only two people, Zalo doesn't send a typing event.
                                this.emit("typing", typingObject);
                    const parsedData = (await decodeEventData(parsed, this.cipherKey)).data;
                        this.emit("delivered_messages", deliveredObjects);
                        this.emit("seen_messages", seenObjects);
                    const parsedData = (await decodeEventData(parsed, this.cipherKey)).data;
                        this.emit("delivered_messages", deliveredObjects);
                        this.emit("seen_messages", seenObjects);
                this.emit("error", error);
```

### C.2 Tên event từ this.emit(...)

```
cipher_key
closed
connected
delivered_messages
disconnected
error
friend_event
group_event
message
old_messages
old_reactions
reaction
seen_messages
typing
undo
upload_attachment
```

### C.3 find dist -name *listen*

```
dist/apis/listen.d.ts
dist/apis/listen.js
dist/cjs/apis/listen.cjs
```

### C.4 dist/apis/listen.d.ts

```typescript
import EventEmitter from "events";
import { type FriendEvent } from "../models/FriendEvent.js";
import { type GroupEvent } from "../models/GroupEvent.js";
import type { Message, Typing } from "../models/index.js";
import { Reaction, Undo, ThreadType } from "../models/index.js";
import type { ContextSession } from "../context.js";
import { type SeenMessage } from "../models/SeenMessage.js";
import { type DeliveredMessage } from "../models/DeliveredMessage.js";
type UploadEventData = {
    fileUrl: string;
    fileId: string;
};
export type WsPayload<T = Record<string, unknown>> = {
    version: number;
    cmd: number;
    subCmd: number;
    data: T;
};
export type OnMessageCallback = (message: Message) => unknown;
export type OnClosedCallback = (code: CloseReason, reason: string) => unknown;
export type OnErrorCallback = (error: unknown) => unknown;
export declare enum CloseReason {
    ManualClosure = 1000,
    AbnormalClosure = 1006,
    DuplicateConnection = 3000,
    KickConnection = 3003
}
interface ListenerEvents {
    connected: [];
    disconnected: [code: CloseReason, reason: string];
    closed: [code: CloseReason, reason: string];
    error: [error: unknown];
    typing: [typing: Typing];
    message: [message: Message];
    old_messages: [messages: Message[], type: ThreadType];
    seen_messages: [messages: SeenMessage[]];
    delivered_messages: [messages: DeliveredMessage[]];
    reaction: [reaction: Reaction];
    old_reactions: [reactions: Reaction[], isGroup: boolean];
    upload_attachment: [data: UploadEventData];
    undo: [data: Undo];
    friend_event: [data: FriendEvent];
    group_event: [data: GroupEvent];
    cipher_key: [key: string];
}
export declare class Listener extends EventEmitter<ListenerEvents> {
    private ctx;
    private urls;
    private wsURL;
    private cookie;
    private userAgent;
    private ws;
    private retryCount;
    private rotateCount;
    private onConnectedCallback;
    private onClosedCallback;
    private onErrorCallback;
    private onMessageCallback;
    private cipherKey?;
    private selfListen;
    private pingInterval?;
    private id;
    constructor(ctx: ContextSession, urls: string[]);
    /**
     * @deprecated Use `on` method instead
     */
    onConnected(cb: () => unknown): void;
    /**
     * @deprecated Use `on` method instead
     */
    onClosed(cb: OnClosedCallback): void;
    /**
     * @deprecated Use `on` method instead
     */
    onError(cb: OnErrorCallback): void;
    /**
     * @deprecated Use `on` method instead
     */
    onMessage(cb: OnMessageCallback): void;
    private canRetry;
    private shouldRotate;
    private rotateEndpoint;
    start({ retryOnClose }?: {
        retryOnClose?: boolean;
    }): void;
    stop(): void;
    sendWs(payload: WsPayload, requireId?: boolean): void;
    /**
     * Request old messages
     *
     * @param lastMsgId
     */
    requestOldMessages(threadType: ThreadType, lastMsgId?: string | null): void;
    /**
     * Request old messages
     *
     * @param lastMsgId
     */
    requestOldReactions(threadType: ThreadType, lastMsgId?: string | null): void;
    private reset;
}
export {};

```


---

## PHẦN D — quote (grep -r dist)

### D.1 grep quote trong dist *.d.ts -n

```
dist/apis/sendMessage.d.ts:9:export type SendMessageQuote = {
dist/apis/sendMessage.d.ts:80:     * Quoted message (optional)
dist/apis/sendMessage.d.ts:82:    quote?: SendMessageQuote;
dist/index.d.ts:115:export type { Mention, MessageContent, SendMessageQuote, SendMessageResponse, SendMessageResult, Style } from "./apis/sendMessage.js";
dist/models/Message.d.ts:49:    quote: TQuote | undefined;
dist/models/Message.d.ts:54:export type TQuote = {
```

### D.2 grep quote trong dist *.js (tối đa 40 dòng đầu)

```
dist/apis/sendMessage.js:12:function prepareQMSGAttach(quote) {
dist/apis/sendMessage.js:13:    const quoteData = quote;
dist/apis/sendMessage.js:14:    if (typeof quoteData.content == "string")
dist/apis/sendMessage.js:15:        return quoteData.propertyExt;
dist/apis/sendMessage.js:16:    if (quoteData.msgType == "chat.todo")
dist/apis/sendMessage.js:26:    return Object.assign(Object.assign({}, quoteData.content), { thumbUrl: quoteData.content.thumb, oriUrl: quoteData.content.href, normalUrl: quoteData.content.href });
dist/apis/sendMessage.js:28:function prepareQMSG(quote) {
dist/apis/sendMessage.js:29:    const quoteData = quote;
dist/apis/sendMessage.js:30:    if (quoteData.msgType == "chat.todo" && typeof quoteData.content == "object" && typeof quoteData.content.params == "string") {
dist/apis/sendMessage.js:31:        return JSON.parse(quoteData.content.params).item.content;
dist/apis/sendMessage.js:165:    async function handleMessage({ msg, styles, urgency, mentions, quote, ttl }, threadId, type) {
dist/apis/sendMessage.js:171:        if (quote) {
dist/apis/sendMessage.js:172:            if (typeof quote.content != "string" && quote.msgType == "webchat") {
dist/apis/sendMessage.js:173:                throw new ZaloApiError("This kind of `webchat` quote type is not available");
dist/apis/sendMessage.js:175:            if (quote.msgType == "group.poll") {
dist/apis/sendMessage.js:176:                throw new ZaloApiError("The `group.poll` quote type is not available");
dist/apis/sendMessage.js:180:        const params = quote
dist/apis/sendMessage.js:187:                qmsgOwner: quote.uidFrom,
dist/apis/sendMessage.js:188:                qmsgId: quote.msgId,
dist/apis/sendMessage.js:189:                qmsgCliId: quote.cliMsgId,
dist/apis/sendMessage.js:190:                qmsgType: getClientMessageType(quote.msgType),
dist/apis/sendMessage.js:191:                qmsgTs: quote.ts,
dist/apis/sendMessage.js:192:                qmsg: typeof quote.content == "string" ? quote.content : prepareQMSG(quote),
dist/apis/sendMessage.js:195:                qmsgAttach: isGroupMessage ? JSON.stringify(prepareQMSGAttach(quote)) : undefined,
dist/apis/sendMessage.js:196:                qmsgTTL: quote.ttl,
dist/apis/sendMessage.js:216:        if (quote) {
dist/apis/sendMessage.js:217:            finalServiceUrl.pathname = finalServiceUrl.pathname + "/quote";
dist/apis/sendMessage.js:230:    async function handleAttachment({ msg, attachments, mentions, quote, ttl, urgency }, threadId, type) {
dist/apis/sendMessage.js:282:                            mentionInfo: isMentionsValid && canBeDesc && !quote ? JSON.stringify(mentionsFinal) : undefined,
dist/apis/sendMessage.js:406:     * @param quote Message or GroupMessage instance (optional), used for quoting
dist/apis/sendMessage.js:418:        const { quote, ttl, styles, urgency } = message;
dist/apis/sendMessage.js:434:            if ((!canBeDesc && msg.length > 0) || (msg.length > 0 && quote)) {
dist/apis/sendMessage.js:442:            const handledData = await handleAttachment({ msg, mentions, attachments, quote, ttl, styles, urgency }, threadId, type);
dist/models/Message.js:12:        if (data.quote) {
dist/models/Message.js:13:            data.quote.ownerId = String(data.quote.ownerId);
dist/models/Message.js:25:        if (data.quote) {
dist/models/Message.js:26:            data.quote.ownerId = String(data.quote.ownerId);
```

### D.3 Trích `TMessage.quote` / `TQuote` và runtime normalize (`dist/models/Message.d.ts` đầy đủ đã ở PHẦN A)

```typescript
export type TMessage = {
    actionId: string;
    msgId: string;
    cliMsgId: string;
    msgType: string;
    uidFrom: string;
    idTo: string;
    dName: string;
    ts: string;
    status: number;
    content: string | TAttachmentContent | TOtherContent;
    notify: string;
    ttl: number;
    userId: string;
    uin: string;
    topOut: string;
    topOutTimeOut: string;
    topOutImprTimeOut: string;
    propertyExt: {
        color: number;
        size: number;
        type: number;
        subType: number;
        ext: string;
    } | undefined;
    paramsExt: {
        countUnread: number;
        containType: number;
        platformType: number;
    };
    cmd: number;
    st: number;
    at: number;
    realMsgId: string;
    quote: TQuote | undefined;
};
export type TQuote = {
    ownerId: string;
    cliMsgId: number;
    globalMsgId: number;
    cliMsgType: number;
    ts: number;
    msg: string;
    attach: string;
    fromD: string;
    ttl: number;
};
```

### Phụ lục — `node_modules/zca-js/index.d.ts` (root package)

```typescript
export * from "./dist";
export as namespace Zalo;
```

