/**
 * Auth Middleware Unit Tests
 */

import { Request, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import { AuthService } from '../../services/AuthService';

describe('authenticate middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      headers: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  it('should return 401 when no authorization header is present', () => {
    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header does not start with Bearer', () => {
    mockReq.headers = { authorization: 'Basic sometoken' };

    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', () => {
    mockReq.headers = { authorization: 'Bearer invalid-token' };

    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() and set userId for valid token', () => {
    const userId = 'test-user-id-789';
    const validToken = AuthService.generateJWT(userId);
    mockReq.headers = { authorization: `Bearer ${validToken}` };

    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(mockReq.userId).toBe(userId);
    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should handle token with extra spaces', () => {
    const userId = 'user-123';
    const validToken = AuthService.generateJWT(userId);
    mockReq.headers = { authorization: `Bearer  ${validToken}` }; // Double space

    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

    // Should fail because of extra space
    expect(statusMock).toHaveBeenCalledWith(401);
  });

  it('should return 401 for empty Bearer token', () => {
    mockReq.headers = { authorization: 'Bearer ' };

    authenticate(mockReq as AuthRequest, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
