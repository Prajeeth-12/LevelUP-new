import React from 'react';
import { User, LogOut, Zap, SunMoon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './button';
import { cn } from '../../lib/utils';
import { getAuth } from 'firebase/auth';
import { useTheme } from '../../contexts/ThemeContext';

export function FloatingHeader({ onLogout, userName }) {
	const navigate = useNavigate();
	const auth = getAuth();
	const { theme, toggleTheme } = useTheme();
	const userInitial = userName?.charAt(0)?.toUpperCase() || auth.currentUser?.email?.charAt(0)?.toUpperCase() || 'U';

	return (
		<header
			className={cn(
				'sticky top-5 z-50',
				'mx-auto w-[92%] sm:w-full max-w-2xl rounded-full border shadow dark:shadow-none',
				'bg-background/95 dark:bg-card/95 supports-[backdrop-filter]:bg-background/80 dark:supports-[backdrop-filter]:bg-zinc-900/80 backdrop-blur-lg',
				'dark:border-border',
			)}
		>
			<nav className="mx-auto flex items-center justify-between p-1 px-3">
				<div
					className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 duration-100"
					onClick={() => navigate('/dashboard')}
				>
					<div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shadow-md">
					<Zap className="size-4 fill-white stroke-white" />
				</div>	<p className="font-mono text-sm font-bold text-gray-900 dark:text-foreground">LevelUP</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => navigate('/skill-gap')}
						className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
					>
						<Zap className="w-3 h-3 fill-current" />
						Skill Gap
					</button>
					{userName && <span className="text-xs font-semibold text-foreground hidden sm:inline-block mr-2">{userName}</span>}

					{/* Profile Circle Avatar */}
					<div
						className="h-8 w-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:opacity-90 transition-opacity shadow-xs"
						onClick={() => navigate('/profile')}
					>
						{userInitial}
					</div>

					<button
						onClick={toggleTheme}
						className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-border text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-accent hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
						title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
						aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
					>
						<SunMoon className="w-3 h-3" />
						{theme === 'light' ? 'Light mode' : 'Dark mode'}
					</button>
					<Button
						variant="ghost"
						size="icon"
						className="rounded-full h-8 w-8 text-gray-500 hover:text-red-600"
						onClick={onLogout}
					>
						<LogOut className="h-4 w-4" />
					</Button>
				</div>
			</nav>
		</header>
	);
}
