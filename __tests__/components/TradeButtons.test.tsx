/**
 * Unit tests for TradeButtons component
 * Tests button states, validation, and trade execution
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TradeButtons } from '@/components/dashboard/TradeButtons'
import { TradeConfig } from '@/types/dashboard'

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

describe('TradeButtons Component', () => {
  const mockOnTrade = jest.fn()
  
  const defaultProps = {
    asset: 'R_100',
    duration: 1,
    durationUnit: 'm' as const,
    stake: 10,
    balance: 1000,
    minStake: 1,
    maxStake: 10000,
    onTrade: mockOnTrade,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render CALL and PUT buttons', () => {
      render(<TradeButtons {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /CALL/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /PUT/i })).toBeInTheDocument()
    })

    it('should render enable/disable toggle', () => {
      render(<TradeButtons {...defaultProps} />)
      
      expect(screen.getByText('Manual Trading')).toBeInTheDocument()
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('should show OFF status initially', () => {
      render(<TradeButtons {...defaultProps} />)
      
      expect(screen.getByText('OFF')).toBeInTheDocument()
    })
  })

  describe('Enable/Disable Toggle', () => {
    it('should enable trading when toggle is switched on', () => {
      render(<TradeButtons {...defaultProps} />)
      
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      
      expect(screen.getByText('ON')).toBeInTheDocument()
    })

    it('should disable trading when toggle is switched off', () => {
      render(<TradeButtons {...defaultProps} />)
      
      const toggle = screen.getByRole('switch')
      
      // Enable first
      fireEvent.click(toggle)
      expect(screen.getByText('ON')).toBeInTheDocument()
      
      // Then disable
      fireEvent.click(toggle)
      expect(screen.getByText('OFF')).toBeInTheDocument()
    })

    it('should show warning message when trading is disabled', () => {
      render(<TradeButtons {...defaultProps} />)
      
      expect(screen.getByText(/Enable manual trading to execute trades/i)).toBeInTheDocument()
    })
  })

  describe('Button States', () => {
    it('should disable buttons when trading is not enabled', () => {
      render(<TradeButtons {...defaultProps} />)
      
      const callButton = screen.getByRole('button', { name: /CALL/i })
      const putButton = screen.getByRole('button', { name: /PUT/i })
      
      expect(callButton).toBeDisabled()
      expect(putButton).toBeDisabled()
    })

    it('should enable buttons when trading is enabled and validation passes', () => {
      render(<TradeButtons {...defaultProps} />)
      
      // Enable trading
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      
      const callButton = screen.getByRole('button', { name: /CALL/i })
      const putButton = screen.getByRole('button', { name: /PUT/i })
      
      expect(callButton).not.toBeDisabled()
      expect(putButton).not.toBeDisabled()
    })

    it('should disable buttons when disabled prop is true', () => {
      render(<TradeButtons {...defaultProps} disabled={true} />)
      
      const toggle = screen.getByRole('switch')
      expect(toggle).toBeDisabled()
    })
  })

  describe('Validation', () => {
    it('should show error for invalid stake amount', () => {
      render(<TradeButtons {...defaultProps} stake={0} />)
      
      // Enable trading
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      
      expect(screen.getByText(/Invalid stake amount/i)).toBeInTheDocument()
    })

    it('should show error for insufficient balance', () => {
      render(<TradeButtons {...defaultProps} stake={2000} balance={1000} />)
      
      // Enable trading
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      
      expect(screen.getByText(/Insufficient balance/i)).toBeInTheDocument()
    })

    it('should show ready message when all validations pass', () => {
      render(<TradeButtons {...defaultProps} />)
      
      // Enable trading
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      
      expect(screen.getByText(/Ready to trade/i)).toBeInTheDocument()
    })
  })

  describe('Trade Execution', () => {
    it('should execute CALL trade when button is clicked', async () => {
      mockOnTrade.mockResolvedValue(undefined)
      
      render(<TradeButtons {...defaultProps} />)
      
      // Enable trading
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      
      // Click CALL button
      const callButton = screen.getByRole('button', { name: /CALL/i })
      fireEvent.click(callButton)
      
      await waitFor(() => {
        expect(mockOnTrade).toHaveBeenCalledWith({
          asset: 'R_100',
          duration: 1,
          duration_unit: 'm',
          stake: 10,
          type: 'CALL',
        })
      })
    })

    it('should execute PUT trade when button is clicked', async () => {
      mockOnTrade.mockResolvedValue(undefined)
      
      render(<TradeButtons {...defaultProps} />)
      
      // Enable trading
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      
      // Click PUT button
      const putButton = screen.getByRole('button', { name: /PUT/i })
      fireEvent.click(putButton)
      
      await waitFor(() => {
        expect(mockOnTrade).toHaveBeenCalledWith({
          asset: 'R_100',
          duration: 1,
          duration_unit: 'm',
          stake: 10,
          type: 'PUT',
        })
      })
    })

    it('should show loading state during trade execution', async () => {
      mockOnTrade.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<TradeButtons {...defaultProps} />)
      
      // Enable trading
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      
      // Click CALL button
      const callButton = screen.getByRole('button', { name: /CALL/i })
      fireEvent.click(callButton)
      
      // Should show loading state
      expect(screen.getByText(/Executing.../i)).toBeInTheDocument()
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText(/Executing.../i)).not.toBeInTheDocument()
      })
    })

    it('should disable other button during execution', async () => {
      mockOnTrade.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<TradeButtons {...defaultProps} />)
      
      // Enable trading
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      
      // Click CALL button
      const callButton = screen.getByRole('button', { name: /CALL/i })
      const putButton = screen.getByRole('button', { name: /PUT/i })
      
      fireEvent.click(callButton)
      
      // PUT button should be disabled during CALL execution
      expect(putButton).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(putButton).not.toBeDisabled()
      })
    })

    it('should handle trade execution errors', async () => {
      const error = new Error('Insufficient balance')
      mockOnTrade.mockRejectedValue(error)
      
      render(<TradeButtons {...defaultProps} />)
      
      // Enable trading
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      
      // Click CALL button
      const callButton = screen.getByRole('button', { name: /CALL/i })
      fireEvent.click(callButton)
      
      await waitFor(() => {
        expect(mockOnTrade).toHaveBeenCalled()
      })
      
      // Button should be enabled again after error
      await waitFor(() => {
        expect(callButton).not.toBeDisabled()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing balance prop', () => {
      const { balance, ...propsWithoutBalance } = defaultProps
      render(<TradeButtons {...propsWithoutBalance} />)
      
      // Enable trading
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      
      // Should still work without balance check
      expect(screen.getByText(/Ready to trade/i)).toBeInTheDocument()
    })

    it('should prevent trade when not enabled', async () => {
      render(<TradeButtons {...defaultProps} />)
      
      // Try to click without enabling (buttons are disabled, but test the logic)
      const callButton = screen.getByRole('button', { name: /CALL/i })
      
      // Button should be disabled
      expect(callButton).toBeDisabled()
      
      // onTrade should not be called
      expect(mockOnTrade).not.toHaveBeenCalled()
    })
  })
})
