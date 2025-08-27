const Card = require('../models/Card');
const User = require('../models/User');
const { sendAssignmentEmail } = require('../controllers/userController');

// Check for cards due tomorrow and send reminders
const checkDueCards = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Set time to start of tomorrow (00:00:00)
    tomorrow.setHours(0, 0, 0, 0);
    
    // Find cards due tomorrow that haven't had reminders sent
    const dueCards = await Card.find({
      dueDate: {
        $gte: tomorrow,
        $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) // Next day
      },
      reminderSent: false,
      assignedTo: { $exists: true, $ne: null }
    });
    
    for (const card of dueCards) {
      if (card.assignedTo && card.assignedTo.startsWith('@')) {
        const username = card.assignedTo.slice(1);
        const user = await User.findOne({ username });
        
        if (user && user.email) {
          try {
            await sendAssignmentEmail(
              user.email,
              'System',
              `Reminder: ${card.text} is due tomorrow!`,
              `Your task "${card.text}" is due tomorrow (${new Date(card.dueDate).toLocaleDateString()}). Please check your board and complete it on time.`
            );
            
            // Mark reminder as sent
            await Card.findByIdAndUpdate(card._id, { 
              reminderSent: true,
              lastReminderSent: new Date()
            });
            console.log(`Reminder sent for card due tomorrow: ${card.text}`);
          } catch (error) {
            console.error(`Failed to send reminder for card ${card._id}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking due cards:', error);
  }
};

// Check for overdue cards and send urgent reminders
const checkOverdueCards = async () => {
  try {
    const now = new Date();
    
    // Find overdue cards (due date has passed)
    const overdueCards = await Card.find({
      dueDate: { $lt: now },
      assignedTo: { $exists: true, $ne: null }
    });
    
    for (const card of overdueCards) {
      if (card.assignedTo && card.assignedTo.startsWith('@')) {
        const username = card.assignedTo.slice(1);
        const user = await User.findOne({ username });
        
        if (user && user.email) {
          try {
            const daysOverdue = Math.floor((now - new Date(card.dueDate)) / (1000 * 60 * 60 * 24));
            
            await sendAssignmentEmail(
              user.email,
              'System',
              `URGENT: ${card.text} is overdue!`,
              `Your task "${card.text}" was due on ${new Date(card.dueDate).toLocaleDateString()} and is now ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue. Please complete it immediately.`
            );
            
            console.log(`Overdue reminder sent for card: ${card.text} (${daysOverdue} days overdue)`);
          } catch (error) {
            console.error(`Failed to send overdue reminder for card ${card._id}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking overdue cards:', error);
  }
};

// Run reminder check every hour
const startReminderScheduler = () => {
  // Check immediately on startup
  checkDueCards();
  checkOverdueCards();
  
  // Then check every hour
  setInterval(() => {
    checkDueCards();
    checkOverdueCards();
  }, 60 * 60 * 1000);
  
  console.log('Reminder scheduler started - checking for due and overdue cards');
};

module.exports = { startReminderScheduler, checkDueCards };
