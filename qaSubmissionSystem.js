const { saveDataImmediate } = require('./dataManager.js');
const { EmbedBuilder } = require('discord.js');

function initializeQASubmissions(data) {
  if (!data.globalQASubmissions) {
    data.globalQASubmissions = [];
  }
  return data.globalQASubmissions;
}

async function submitQA(data, userId, keyword, question, answer) {
  initializeQASubmissions(data);
  
  if (!keyword || !question || !answer) {
    return { success: false, message: '❌ Keyword, question, and answer are all required!' };
  }
  
  if (keyword.length > 50) {
    return { success: false, message: '❌ Keyword must be 50 characters or less!' };
  }
  
  if (answer.length > 2000) {
    return { success: false, message: '❌ Answer must be 2000 characters or less!' };
  }
  
  const submissionId = `SUB${Math.random().toString(36).substring(7).toUpperCase()}`;
  
  data.globalQASubmissions.push({
    id: submissionId,
    userId,
    keyword: keyword.toLowerCase(),
    question,
    answer,
    status: 'pending',
    submittedAt: Date.now(),
    reviewedAt: null,
    reviewedBy: null
  });
  
  await saveDataImmediate(data);
  return { 
    success: true, 
    message: `✅ Q&A submitted for approval!\n**ID:** ${submissionId}\n**Status:** Pending review\n💎 Reward: 10 gems if approved!`,
    submissionId
  };
}

async function getPendingSubmissions(data) {
  initializeQASubmissions(data);
  return data.globalQASubmissions.filter(sub => sub.status === 'pending');
}

async function approveQASubmission(data, submissionId, reviewerId, client) {
  initializeQASubmissions(data);
  
  const submission = data.globalQASubmissions.find(sub => sub.id === submissionId);
  if (!submission) {
    return { success: false, message: `❌ Submission **${submissionId}** not found!` };
  }
  
  if (submission.status !== 'pending') {
    return { success: false, message: `❌ Submission is already **${submission.status}**!` };
  }
  
  // Add Q&A to approved list
  const qaData = require('./qaSystem.js');
  if (!data.globalQA) data.globalQA = [];
  
  const existing = data.globalQA.find(qa => qa.keyword.toLowerCase() === submission.keyword.toLowerCase());
  if (existing) {
    return { success: false, message: `❌ Q&A entry for **${submission.keyword}** already exists!` };
  }
  
  data.globalQA.push({
    keyword: submission.keyword,
    question: submission.question,
    message: submission.answer,
    createdAt: Date.now(),
    submittedBy: submission.userId
  });
  
  // Give user 10 gems
  if (!data.users[submission.userId]) {
    data.users[submission.userId] = { gems: 0, coins: 0, characters: [], selectedCharacter: null, started: false };
  }
  data.users[submission.userId].gems += 10;
  
  // Update submission
  submission.status = 'approved';
  submission.reviewedAt = Date.now();
  submission.reviewedBy = reviewerId;
  
  await saveDataImmediate(data);
  
  // Send DM to user
  try {
    const user = await client.users.fetch(submission.userId);
    const dmEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ Q&A Approved!')
      .setDescription(
        `Your Q&A submission has been **approved**!\n\n` +
        `**Keyword:** \`${submission.keyword}\`\n` +
        `**Question:** ${submission.question}\n` +
        `**Answer:** ${submission.answer}\n\n` +
        `💎 **Reward:** +10 Gems (Added to your account)`
      )
      .setFooter({ text: 'Thank you for contributing to ZooBot!' })
      .setTimestamp();
    
    await user.send({ embeds: [dmEmbed] });
  } catch (error) {
    console.error(`Error sending DM to user ${submission.userId}:`, error);
  }
  
  return { 
    success: true, 
    message: `✅ Q&A **${submissionId}** approved!\n💎 User received 10 gems!`
  };
}

async function rejectQASubmission(data, submissionId, reason, reviewerId, client) {
  initializeQASubmissions(data);
  
  const submission = data.globalQASubmissions.find(sub => sub.id === submissionId);
  if (!submission) {
    return { success: false, message: `❌ Submission **${submissionId}** not found!` };
  }
  
  if (submission.status !== 'pending') {
    return { success: false, message: `❌ Submission is already **${submission.status}**!` };
  }
  
  submission.status = 'rejected';
  submission.reviewedAt = Date.now();
  submission.reviewedBy = reviewerId;
  submission.rejectionReason = reason || 'No reason provided';
  
  await saveDataImmediate(data);
  
  // Send DM to user
  try {
    const user = await client.users.fetch(submission.userId);
    const dmEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('❌ Q&A Rejected')
      .setDescription(
        `Your Q&A submission has been **rejected**.\n\n` +
        `**Keyword:** \`${submission.keyword}\`\n` +
        `**Reason:** ${reason || 'No reason provided'}\n\n` +
        `You can resubmit an improved version!`
      )
      .setFooter({ text: 'Keep contributing to make ZooBot better!' })
      .setTimestamp();
    
    await user.send({ embeds: [dmEmbed] });
  } catch (error) {
    console.error(`Error sending DM to user ${submission.userId}:`, error);
  }
  
  return { 
    success: true, 
    message: `❌ Q&A **${submissionId}** rejected!`
  };
}

function formatSubmissionEmbed(submission, index = null) {
  return new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle(`📝 Q&A Submission ${index ? `#${index}` : submission.id}`)
    .setDescription(`**ID:** ${submission.id}\n**Status:** ${submission.status.toUpperCase()}`)
    .addFields(
      { name: '🔑 Keyword', value: `\`${submission.keyword}\`` },
      { name: '❓ Question', value: submission.question.substring(0, 1024) || 'N/A' },
      { name: '💬 Answer', value: submission.answer.substring(0, 1024) || 'N/A' },
      { name: '👤 Submitted By', value: `<@${submission.userId}>` },
      { name: '⏰ Submitted', value: `<t:${Math.floor(submission.submittedAt / 1000)}:R>` }
    )
    .setFooter({ text: 'Use !approveqa or !rejectqa to review' });
}

module.exports = {
  initializeQASubmissions,
  submitQA,
  getPendingSubmissions,
  approveQASubmission,
  rejectQASubmission,
  formatSubmissionEmbed
};
