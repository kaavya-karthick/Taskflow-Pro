-- TaskFlow Pro Database Seed Data
-- Run this after creating the schema to populate with sample data

-- Insert demo users
-- Password for all demo users: 'password123'
INSERT INTO users (name, email, password_hash, avatar_url, timezone) VALUES
('Demo User', 'demo@taskflow.pro', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo', 'America/New_York'),
('John Smith', 'john@taskflow.pro', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', 'America/Los_Angeles'),
('Sarah Johnson', 'sarah@taskflow.pro', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'Europe/London'),
('Mike Chen', 'mike@taskflow.pro', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', 'Asia/Tokyo'),
('Emily Davis', 'emily@taskflow.pro', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily', 'Australia/Sydney');

-- Insert projects
INSERT INTO projects (name, description, color, owner_id) VALUES
('Website Redesign', 'Complete overhaul of company website with modern design', '#6366F1', (SELECT id FROM users WHERE email = 'demo@taskflow.pro')),
('Mobile App Development', 'Build iOS and Android apps for our platform', '#10B981', (SELECT id FROM users WHERE email = 'demo@taskflow.pro')),
('Marketing Campaign Q1', 'First quarter marketing initiatives and campaigns', '#F59E0B', (SELECT id FROM users WHERE email = 'john@taskflow.pro')),
('Internal Tools', 'Build tools to improve team productivity', '#EF4444', (SELECT id FROM users WHERE email = 'sarah@taskflow.pro'));

-- Add project members
INSERT INTO project_members (project_id, user_id, role) VALUES
-- Website Redesign
((SELECT id FROM projects WHERE name = 'Website Redesign'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 'owner'),
((SELECT id FROM projects WHERE name = 'Website Redesign'), (SELECT id FROM users WHERE email = 'john@taskflow.pro'), 'admin'),
((SELECT id FROM projects WHERE name = 'Website Redesign'), (SELECT id FROM users WHERE email = 'sarah@taskflow.pro'), 'member'),
-- Mobile App Development
((SELECT id FROM projects WHERE name = 'Mobile App Development'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 'owner'),
((SELECT id FROM projects WHERE name = 'Mobile App Development'), (SELECT id FROM users WHERE email = 'mike@taskflow.pro'), 'admin'),
((SELECT id FROM projects WHERE name = 'Mobile App Development'), (SELECT id FROM users WHERE email = 'emily@taskflow.pro'), 'member'),
-- Marketing Campaign Q1
((SELECT id FROM projects WHERE name = 'Marketing Campaign Q1'), (SELECT id FROM users WHERE email = 'john@taskflow.pro'), 'owner'),
((SELECT id FROM projects WHERE name = 'Marketing Campaign Q1'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 'member'),
((SELECT id FROM projects WHERE name = 'Marketing Campaign Q1'), (SELECT id FROM users WHERE email = 'sarah@taskflow.pro'), 'member'),
-- Internal Tools
((SELECT id FROM projects WHERE name = 'Internal Tools'), (SELECT id FROM users WHERE email = 'sarah@taskflow.pro'), 'owner'),
((SELECT id FROM projects WHERE name = 'Internal Tools'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 'admin'),
((SELECT id FROM projects WHERE name = 'Internal Tools'), (SELECT id FROM users WHERE email = 'mike@taskflow.pro'), 'member');

-- Insert tasks for Website Redesign project
INSERT INTO tasks (project_id, title, description, priority, status, due_date, assigned_user, created_by, position, estimated_hours, tags) VALUES
((SELECT id FROM projects WHERE name = 'Website Redesign'), 'Design homepage mockup', 'Create Figma mockups for the new homepage design', 'high', 'completed', CURRENT_DATE - INTERVAL '5 days', (SELECT id FROM users WHERE email = 'sarah@taskflow.pro'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 1, 8, ARRAY['design', 'figma']),
((SELECT id FROM projects WHERE name = 'Website Redesign'), 'Set up development environment', 'Configure local dev environment with Next.js and Tailwind', 'medium', 'completed', CURRENT_DATE - INTERVAL '3 days', (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 2, 4, ARRAY['dev', 'setup']),
((SELECT id FROM projects WHERE name = 'Website Redesign'), 'Implement responsive navigation', 'Build mobile-first responsive navigation component', 'high', 'in_progress', CURRENT_DATE + INTERVAL '2 days', (SELECT id FROM users WHERE email = 'john@taskflow.pro'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 1, 12, ARRAY['dev', 'frontend']),
((SELECT id FROM projects WHERE name = 'Website Redesign'), 'Create content for about page', 'Write copy and gather images for the about page', 'medium', 'todo', CURRENT_DATE + INTERVAL '5 days', (SELECT id FROM users WHERE email = 'sarah@taskflow.pro'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 1, 6, ARRAY['content']),
((SELECT id FROM projects WHERE name = 'Website Redesign'), 'SEO optimization', 'Implement meta tags, sitemap, and structured data', 'medium', 'todo', CURRENT_DATE + INTERVAL '7 days', (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 2, 8, ARRAY['seo', 'marketing']),
((SELECT id FROM projects WHERE name = 'Website Redesign'), 'Performance testing', 'Run Lighthouse audits and optimize performance', 'low', 'todo', CURRENT_DATE + INTERVAL '10 days', (SELECT id FROM users WHERE email = 'john@taskflow.pro'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 3, 6, ARRAY['testing', 'performance']);

-- Insert tasks for Mobile App Development project
INSERT INTO tasks (project_id, title, description, priority, status, due_date, assigned_user, created_by, position, estimated_hours, tags) VALUES
((SELECT id FROM projects WHERE name = 'Mobile App Development'), 'Create app wireframes', 'Design wireframes for all app screens', 'high', 'completed', CURRENT_DATE - INTERVAL '7 days', (SELECT id FROM users WHERE email = 'emily@taskflow.pro'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 1, 16, ARRAY['design', 'wireframes']),
((SELECT id FROM projects WHERE name = 'Mobile App Development'), 'Set up React Native project', 'Initialize project with Expo and configure navigation', 'high', 'in_progress', CURRENT_DATE + INTERVAL '1 day', (SELECT id FROM users WHERE email = 'mike@taskflow.pro'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 1, 8, ARRAY['dev', 'setup']),
((SELECT id FROM projects WHERE name = 'Mobile App Development'), 'Implement user authentication', 'Build login and signup screens with API integration', 'high', 'todo', CURRENT_DATE + INTERVAL '4 days', (SELECT id FROM users WHERE email = 'mike@taskflow.pro'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 1, 16, ARRAY['dev', 'auth']),
((SELECT id FROM projects WHERE name = 'Mobile App Development'), 'Build dashboard screen', 'Create main dashboard with task overview', 'medium', 'todo', CURRENT_DATE + INTERVAL '8 days', (SELECT id FROM users WHERE email = 'emily@taskflow.pro'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 2, 20, ARRAY['dev', 'frontend']),
((SELECT id FROM projects WHERE name = 'Mobile App Development'), 'Push notifications', 'Implement push notification service', 'low', 'todo', CURRENT_DATE + INTERVAL '14 days', (SELECT id FROM users WHERE email = 'mike@taskflow.pro'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 3, 12, ARRAY['dev', 'notifications']);

-- Insert tasks for Marketing Campaign Q1 project
INSERT INTO tasks (project_id, title, description, priority, status, due_date, assigned_user, created_by, position, estimated_hours, tags) VALUES
((SELECT id FROM projects WHERE name = 'Marketing Campaign Q1'), 'Define target audience', 'Research and document target customer personas', 'high', 'completed', CURRENT_DATE - INTERVAL '10 days', (SELECT id FROM users WHERE email = 'john@taskflow.pro'), (SELECT id FROM users WHERE email = 'john@taskflow.pro'), 1, 8, ARRAY['research', 'strategy']),
((SELECT id FROM projects WHERE name = 'Marketing Campaign Q1'), 'Create social media calendar', 'Plan content for Q1 across all social channels', 'high', 'in_progress', CURRENT_DATE + INTERVAL '2 days', (SELECT id FROM users WHERE email = 'sarah@taskflow.pro'), (SELECT id FROM users WHERE email = 'john@taskflow.pro'), 1, 12, ARRAY['social', 'content']),
((SELECT id FROM projects WHERE name = 'Marketing Campaign Q1'), 'Design email templates', 'Create HTML email templates for campaigns', 'medium', 'todo', CURRENT_DATE + INTERVAL '5 days', (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), (SELECT id FROM users WHERE email = 'john@taskflow.pro'), 1, 10, ARRAY['design', 'email']),
((SELECT id FROM projects WHERE name = 'Marketing Campaign Q1'), 'Launch ad campaign', 'Set up and launch Google Ads campaign', 'high', 'todo', CURRENT_DATE + INTERVAL '7 days', (SELECT id FROM users WHERE email = 'john@taskflow.pro'), (SELECT id FROM users WHERE email = 'john@taskflow.pro'), 2, 6, ARRAY['ads', 'ppc']);

-- Insert tasks for Internal Tools project
INSERT INTO tasks (project_id, title, description, priority, status, due_date, assigned_user, created_by, position, estimated_hours, tags) VALUES
((SELECT id FROM projects WHERE name = 'Internal Tools'), 'Team chat integration', 'Integrate Slack for team notifications', 'medium', 'completed', CURRENT_DATE - INTERVAL '2 days', (SELECT id FROM users WHERE email = 'mike@taskflow.pro'), (SELECT id FROM users WHERE email = 'sarah@taskflow.pro'), 1, 8, ARRAY['integration', 'slack']),
((SELECT id FROM projects WHERE name = 'Internal Tools'), 'Build reporting dashboard', 'Create analytics dashboard for management', 'high', 'in_progress', CURRENT_DATE + INTERVAL '3 days', (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), (SELECT id FROM users WHERE email = 'sarah@taskflow.pro'), 1, 24, ARRAY['dev', 'analytics']),
((SELECT id FROM projects WHERE name = 'Internal Tools'), 'Automated backup system', 'Set up automated database backups', 'high', 'todo', CURRENT_DATE + INTERVAL '5 days', (SELECT id FROM users WHERE email = 'mike@taskflow.pro'), (SELECT id FROM users WHERE email = 'sarah@taskflow.pro'), 1, 12, ARRAY['devops', 'backup']),
((SELECT id FROM projects WHERE name = 'Internal Tools'), 'Employee onboarding workflow', 'Build workflow for new employee onboarding', 'medium', 'todo', CURRENT_DATE + INTERVAL '10 days', (SELECT id FROM users WHERE email = 'sarah@taskflow.pro'), (SELECT id FROM users WHERE email = 'sarah@taskflow.pro'), 2, 16, ARRAY['workflow', 'hr']);

-- Insert some comments
INSERT INTO comments (task_id, user_id, message) VALUES
((SELECT id FROM tasks WHERE title = 'Design homepage mockup'), (SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 'Looks great! Can we add a hero section with the new branding?'),
((SELECT id FROM tasks WHERE title = 'Design homepage mockup'), (SELECT id FROM users WHERE email = 'sarah@taskflow.pro'), 'Good idea, I will update the mockups with the hero section.'),
((SELECT id FROM tasks WHERE title = 'Set up React Native project'), (SELECT id FROM users WHERE email = 'mike@taskflow.pro'), 'Project is set up. Using Expo SDK 49 with TypeScript.'),
((SELECT id FROM tasks WHERE title = 'Create social media calendar'), (SELECT id FROM users WHERE email = 'john@taskflow.pro'), 'Please include LinkedIn and Twitter posts for product launch.');

-- Insert some notifications
INSERT INTO notifications (user_id, type, title, message, related_task_id, related_project_id) VALUES
((SELECT id FROM users WHERE email = 'demo@taskflow.pro'), 'task_assigned', 'New Task Assigned', 'You have been assigned to task: Build reporting dashboard', (SELECT id FROM tasks WHERE title = 'Build reporting dashboard'), (SELECT id FROM projects WHERE name = 'Internal Tools')),
((SELECT id FROM users WHERE email = 'john@taskflow.pro'), 'comment_added', 'New Comment', 'New comment on task: Design homepage mockup', (SELECT id FROM tasks WHERE title = 'Design homepage mockup'), (SELECT id FROM projects WHERE name = 'Website Redesign')),
((SELECT id FROM users WHERE email = 'sarah@taskflow.pro'), 'task_assigned', 'New Task Assigned', 'You have been assigned to task: Create social media calendar', (SELECT id FROM tasks WHERE title = 'Create social media calendar'), (SELECT id FROM projects WHERE name = 'Marketing Campaign Q1'));

-- Update some tasks as completed to generate statistics
UPDATE tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP - INTERVAL '2 days' 
WHERE title IN ('Design homepage mockup', 'Set up development environment', 'Create app wireframes', 'Define target audience', 'Team chat integration');
